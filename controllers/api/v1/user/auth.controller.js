const { users, credentials, roles } = require('../../../../models');
const { generateToken } = require('../../../../utils/jwt.util');
const { generateOTP, saveOTP, verifyOTP } = require('../../../../utils/otp.util');
const bcrypt = require('bcrypt');

/**
 * Initial login step for all users - validates credentials and generates OTP
 * @param {string} usernameOrEmail - Username or email of any user
 * @param {string} password - User's password
 * @returns {Object} Initial login data with userId, email, username, and OTP
 */
async function initiateLogin(usernameOrEmail, password) {
    try {
        // Find user by username or email from Credentials table
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

        // Generate OTP and save
        const otp = generateOTP(6);
        const expiryMinutes = 5;
        await saveOTP(credential.user.id, otp, expiryMinutes);

        return {
            userId: credential.user.id,
            email: credential.email,
            username: credential.username,
            role: credential.user.role ? credential.user.role.name : null,
            otp // Only exposed in development
        };
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Verify OTP and complete login process for regular users
 */
async function verifyUserOTP(usernameOrEmail, otpToVerify) {
    try {
        // Find credential by username or email
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
                    as: 'role'
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
        const token = generateToken({
            id: credential.user_id,
            role: credential.user.role ? credential.user.role.name : 'user',
            role_id: credential.user.role_id
        });

        return {
            user: {
                id: credential.user_id,
                email: credential.email,
                username: credential.username,
                role: credential.user.role ? credential.user.role.name : 'user'
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
                attributes: ['email', 'username']
            }]
        });
    } catch (error) {
        throw new Error(`Failed to get user: ${error.message}`);
    }
}

module.exports = {
    initiateLogin,
    verifyUserOTP,
    generateToken: generateUserToken,
    getUserById
};