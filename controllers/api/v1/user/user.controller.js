const { users, credentials, sms_credentials, roles, sequelize } = require('../../../../models');
const { generateToken } = require('../../../../utils/jwt.util');
const { generateOTP, saveOTP, verifyOTP } = require('../../../../utils/otp.util');
const { sendRegistrationOTP } = require('../../../../utils/email.util');
const bcrypt = require('bcrypt');

/**
 * Register a new user
 * User receives OTP via email for verification
 *
 * @param {Object} userData - User data including profile and credentials
 * @returns {Object} Created user object without token (needs OTP verification first)
 */
async function createUser(userData) {
    const {
        first_name,
        last_name,
        dob,
        address,
        phone_number,
        username,
        email,
        password,
        role = 'customer',
        role_id,
        gender = 'male'
    } = userData;

    if (!first_name || !last_name || !dob || !phone_number || !username || !email || !password) {
        throw new Error('Missing required fields');
    }

    const t = await sequelize.transaction();

    try {
        // Resolve role
        let roleRecord;
        if (role) {
            roleRecord = await roles.findOne({ where: { name: role } });
            if (!roleRecord) throw new Error(`Role "${role}" not found`);
        } else if (role_id) {
            roleRecord = await roles.findByPk(role_id);
            if (!roleRecord) throw new Error('Invalid role ID');
        } else {
            throw new Error('Either role or role_id must be provided');
        }

        // Create user
        const user = await users.create({
            first_name,
            last_name,
            dob,
            address: address || null,
            phone_number,
            gender,
            role_id: roleRecord.id,
            is_suspended: false,
        }, { transaction: t });

        // Create credentials (email/password login)
        const hashedPassword = await bcrypt.hash(password, 10);
        await credentials.create({
            username,
            email,
            password: hashedPassword,
            user_id: user.id
        }, { transaction: t });

        // Create SMS credential separately
        await sms_credentials.create({
            phone_number,
            user_id: user.id
        }, { transaction: t });

        // ⭐ COMMIT transaction BEFORE saving OTP
        // This ensures the credentials record exists
        await t.commit();

        // ⭐ Generate OTP and save to credentials table (AFTER commit)
        const otp = generateOTP(6);
        const expiryMinutes = 5;
        await saveOTP(user.id, otp, expiryMinutes);

        // ⭐ Send registration OTP email
        try {
            await sendRegistrationOTP(email, username, otp);
            console.log(`Registration OTP email sent to ${email}`);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // Don't throw - user is created, they can request resend
        }

        console.log(`Registration successful for user ${user.id}`);

        // ⭐ IMPORTANT: Return user data WITHOUT token
        // User must verify OTP before getting token
        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            dob: user.dob,
            address: user.address,
            phone_number,
            username,
            email,
            role: roleRecord.name,
            is_suspended: user.is_suspended,
            // ⭐ Only include OTP in development for testing
            ...(process.env.NODE_ENV === 'development' && { otp })
        };
    } catch (error) {
        // Only rollback if transaction is still active
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error('Error creating user:', error);
        throw error;
    }
}

/**
 * ⭐ NEW: Verify registration OTP and complete account activation
 * @param {string} userId - User ID from registration
 * @param {string} otpToVerify - OTP code sent to user's email
 * @returns {Object} User data with JWT token
 */
async function verifyRegistrationOTP(userId, otpToVerify) {
    try {
        if (!userId || !otpToVerify) {
            throw new Error('User ID and OTP are required');
        }

        // Verify OTP (automatically clears it from credentials table)
        const isValid = await verifyOTP(userId, otpToVerify);
        if (!isValid) {
            throw new Error('Invalid or expired OTP');
        }

        // Get user with credentials and role
        const user = await users.findByPk(userId, {
            include: [
                {
                    model: credentials,
                    as: 'credential',
                    attributes: ['email', 'username']
                },
                {
                    model: roles,
                    as: 'role',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!user) {
            throw new Error('User not found');
        }

        // ⭐ Generate JWT token after successful verification
        const token = generateToken({
            id: user.id,
            username: user.credential.username,
            email: user.credential.email,
            role: user.role ? user.role.name : 'customer',
            role_id: user.role_id
        });

        // Calculate token expiry (24 hours from now)
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        console.log(`Registration OTP verified successfully for user ${user.id}`);

        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            dob: user.dob,
            address: user.address,
            phone_number: user.phone_number,
            username: user.credential.username,
            email: user.credential.email,
            role: user.role ? user.role.name : 'customer',
            token,  // ⭐ Now include token
            tokenExpiry
        };
    } catch (error) {
        console.error('Registration OTP verification error:', error);
        throw error;
    }
}

/**
 * ⭐ NEW: Resend registration OTP
 * @param {string} userId - User ID from registration
 * @returns {Object} Success message
 */
async function resendRegistrationOTP(userId) {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Verify user exists and get email
        const user = await users.findByPk(userId, {
            include: [{
                model: credentials,
                as: 'credential',
                attributes: ['email', 'username']
            }]
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.credential) {
            throw new Error('User credentials not found');
        }

        // Generate new OTP and save to credentials table
        const otp = generateOTP(6);
        const expiryMinutes = 5;
        await saveOTP(user.id, otp, expiryMinutes);

        // Send new OTP email
        await sendRegistrationOTP(
            user.credential.email,
            user.credential.username,
            otp
        );

        console.log(`Registration OTP resent for user ${user.id} to ${user.credential.email}`);

        return {
            message: 'OTP resent successfully',
            email: user.credential.email,
            // ⭐ Only include OTP in development for testing
            ...(process.env.NODE_ENV === 'development' && { otp })
        };
    } catch (error) {
        console.error('Error resending registration OTP:', error);
        throw error;
    }
}

/**
 * Generate token for user (existing function - keeping for compatibility)
 */
async function generateUserToken(user) {
    return generateToken({
        id: user.id,
        role_id: user.role_id
    });
}

/**
 * Get user by ID (existing function - keeping for compatibility)
 */
async function getUserById(id) {
    try {
        const user = await users.findByPk(id, {
            attributes: ['id', 'role_id', 'first_name', 'last_name', 'gender', 'address', 'dob'],
            include: [
                {
                    model: credentials,
                    as: 'credential',
                    attributes: ['email', 'username']
                },
                {
                    model: sms_credentials,
                    as: 'sms_credential',
                    attributes: ['phone_number']
                },
                {
                    model: roles,
                    as: 'role',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!user) {
            return {
                status: "error",
                message: "User not found",
            };
        }

        // Convert to plain object
        const plainUser = user.get({ plain: true });

        // Flatten nested fields
        return {
            id: plainUser.id,
            role_id: plainUser.role_id,
            first_name: plainUser.first_name,
            last_name: plainUser.last_name,
            gender: plainUser.gender,
            address: plainUser.address,
            dob: plainUser.dob,
            email: plainUser.credential?.email || null,
            username: plainUser.credential?.username || null,
            phone_number: plainUser.sms_credential?.phone_number || null,
            name: plainUser.role?.name || null,
        };

    } catch (error) {
        throw new Error(`Failed to get user: ${error.message}`);
    }
}


module.exports = {
    createUser,
    verifyRegistrationOTP,      // ⭐ NEW
    resendRegistrationOTP,       // ⭐ NEW
    generateToken: generateUserToken,
    getUserById
};