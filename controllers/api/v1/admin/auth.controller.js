const { users, credentials, roles } = require('../../../../models');
const { generateToken } = require('../../../../utils/jwt.util');
const { generateOTP, saveOTP, verifyOTP } = require('../../../../utils/otp.util');
const bcrypt = require('bcrypt');

/**
 * Admin authentication - initial login step
 * Validates credentials and generates OTP
 */
async function initiateLogin(usernameOrEmail, password) {
    try {
        // Determine if input is email or username
        const whereCondition = {};
        if (usernameOrEmail.includes('@')) {
            whereCondition.email = usernameOrEmail;
        } else {
            whereCondition.username = usernameOrEmail; // Add username field here
        }

        // Find user using the determined condition
        const credential = await credentials.findOne({
            where: whereCondition,
            include: [{
                model: users,
                as: 'user',
                include: [{
                    model: roles,
                    as: 'role'
                }]
            }]
        });

        if (!credential || !credential.user) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, credential.password);
        if (!isValidPassword) {
            throw new Error('Invalid password');
        }

        // Check if user has admin role
        if (!credential.user.role || credential.user.role.name !== 'admin') {
            throw new Error('Unauthorized access');
        }

        // Generate OTP and save
        const otp = generateOTP(6);
        const expiryMinutes = 5;
        await saveOTP(credential.user.id, otp, expiryMinutes);

        return {
            userId: credential.user.id,
            email: credential.email,
            username: credential.username, // Add username to the response
            otp // Only in development
        };
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Verify OTP and complete login process
 */
async function verifyAdminOTP(usernameOrEmail, otpToVerify) {
    try {
        // Determine if input is email or username
        const whereCondition = {};
        if (usernameOrEmail.includes('@')) {
            whereCondition.email = usernameOrEmail;
        } else {
            whereCondition.username = usernameOrEmail;
        }

        const credential = await credentials.findOne({
            where: whereCondition,
            include: [{
                model: users,
                as: 'user',
                include: [{
                    model: roles,
                    as: 'role',
                    where: { name: 'admin' }
                }]
            }]
        });

        if (!credential || !credential.user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await verifyOTP(credential.user_id, otpToVerify);
        if (!isValid) {
            throw new Error('Invalid or expired OTP');
        }

        // Generate JWT token
        const token = await generateToken({
            id: credential.user_id,
            role: 'admin'
        });

        return {
            user: {
                id: credential.user_id,
                email: credential.email,
                role: 'admin'
            },
            token
        };
    } catch (error) {
        console.error('OTP verification error:', error);
        throw error;
    }
}

/**
 * Generate token for user
 */
async function generateUserToken(user) {
    return generateToken({
        id: user.id,
        role_id: user.role_id
    });
}

/**
 * Get user by ID
 */
async function getUserById(id) {
    try {
        return await users.findByPk(id, {
            attributes: ['id', 'role_id'],
            include: [{
                model: credentials,
                as: 'credential',
                attributes: ['email']
            }]
        });
    } catch (error) {
        throw new Error(`Failed to get user: ${error.message}`);
    }
}

module.exports = {
    initiateLogin,
    verifyAdminOTP,
    generateToken: generateUserToken,
    getUserById
};