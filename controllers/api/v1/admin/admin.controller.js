const { users, credentials, roles, sms_credentials, sequelize } = require('../../../../models');
const bcrypt = require('bcrypt');

/**
* Create a new user with hashed password and appropriate role
* Handles both password and SMS auth
*
* @param {Object} userData - User data including role, credentials, and profile details
* @returns {Object} Created user object without sensitive info
*/
async function createUser(userData) {
    // Extract data
    const {
        first_name,
        last_name,
        role,      // Role name
        role_id,   // Optional role ID
        email,
        username,
        password,
        gender = 'male',
        dob,
        phone_number
    } = userData;

    // Start transaction
    const t = await sequelize.transaction();

    try {
        // Find role ID based on role name or use provided role_id
        let roleRecord;
        if (role) {
            roleRecord = await roles.findOne({ "where": { "name": role } });
            if (!roleRecord) throw new Error(`Role "${role}" not found`);
        } else if (role_id) {
            roleRecord = await roles.findByPk(role_id);
            if (!roleRecord) throw new Error('Invalid role ID');
        } else {
            throw new Error('Either role or role_id must be provided');
        }

        // Create the base user record
        const user = await users.create({
            first_name,
            last_name,
            gender,
            dob,
            "role_id": roleRecord.id,
            "is_suspended": false,
        }, { "transaction": t });

        // Create credentials if password auth
            if (!username || !email || !password) {
                throw new Error('Username, email, and password are required for password auth');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await credentials.create({
                username,
                email,
                "password": hashedPassword,
                "user_id": user.id
            }, { "transaction": t });

        // Create SMS credentials if SMS auth
            if (!phone_number) {
                throw new Error('phone_number is required for SMS auth');
            }
            await sms_credentials.create({
                phone_number,
                "user_id": user.id
            }, { "transaction": t });

        // Commit transaction
        await t.commit();

        // Return safe user object
        return {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": credentials.username,
            "email": credentials.email,
            "phone_number": sms_credentials.phone_number,
            "role": roleRecord.name,
            "is_suspended": user.is_suspended,
            "auth_type": user.auth_type
        };

    } catch (error) {
        await t.rollback();
        console.error('Error creating user:', error);
        throw error;
    }
}

/**
 * Get all user
 */

async function getAllUsers() {
    try {
        const allUsers = await users.findAll({
            include: [
                {
                    model: roles,
                    as: 'role',
                    attributes: ['id', 'name'],
                },
                {
                    model: credentials,
                    as: 'credential',
                    attributes: ['id', 'username', 'email'],
                },
                {
                    model: sms_credentials,
                    as: 'sms_credential',
                    attributes: ['id', 'phone_number'],
                },
            ],
        });

        return allUsers.map(user => ({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            dob: user.dob,
            gender: user.gender,
            is_suspended: user.is_suspended,
            role_id: user.role?.id,
            role_name: user.role?.name,
            credential_id: user.credential?.id,
            username: user.credential?.username,
            email: user.credential?.email,
            sms_credential_id: user.sms_credential?.id,
            phone_number: user.sms_credential?.phone_number,
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}


module.exports = { createUser, getAllUsers };