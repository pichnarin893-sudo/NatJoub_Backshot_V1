'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Get role IDs from database
        const [roles] = await queryInterface.sequelize.query(
            'SELECT id, name FROM "roles" WHERE name IN (\'owner\', \'customer\')'
        );

        const roleMap = roles.reduce((acc, role) => {
            acc[role.name] = role.id;
            return acc;
        }, {});

        // Check if users already exist to avoid duplicates
        const [existingUsers] = await queryInterface.sequelize.query(
            'SELECT email FROM "credentials" WHERE email LIKE \'%@example.com\' OR email LIKE \'%@netjoub.com\''
        );

        if (existingUsers.length > 0) {
            console.log('Mock users already exist. Skipping seeding.');
            return;
        }

        // Hash password once for all users
        const hashedPassword = await bcrypt.hash('Password@123', 10);

        const now = new Date();

        // ---- OWNER USERS ----
        const owners = [
            { id: '123e4561-e89b-12d3-a456-426614174000', firstName: "James", lastName: "Miller", gender: "male" },
            { id: '123e4562-e89b-12d3-a456-426614174000', firstName: "Sophia", lastName: "Chen", gender: "female" },
            { id: '123e4563-e89b-12d3-a456-426614174000', firstName: "Michael", lastName: "Johnson", gender: "male" },
            { id: '123e4564-e89b-12d3-a456-426614174000', firstName: "Emma", lastName: "Rodriguez", gender: "female" },
            { id: '123e4565-e89b-12d3-a456-426614174000', firstName: "Daniel", lastName: "Lee", gender: "male" },
        ];

        // ---- CUSTOMER USERS ----
        const customers = [
            { id: '123e4501-e89b-12d3-a456-426614174000', firstName: "Ava", lastName: "Brown", gender: "female" },
            { id: '123e4502-e89b-12d3-a456-426614174000', firstName: "Ethan", lastName: "Davis", gender: "male" },
            { id: '123e4503-e89b-12d3-a456-426614174000', firstName: "Liam", lastName: "Wilson", gender: "male" },
            { id: '123e4504-e89b-12d3-a456-426614174000', firstName: "Olivia", lastName: "Jones", gender: "female" },
            { id: '123e4505-e89b-12d3-a456-426614174000', firstName: "Noah", lastName: "Martin", gender: "male" },
            { id: '123e4506-e89b-12d3-a456-426614174000', firstName: "Isabella", lastName: "Martinez", gender: "female" },
            { id: '123e4507-e89b-12d3-a456-426614174000', firstName: "Benjamin", lastName: "Taylor", gender: "male" },
            { id: '123e4508-e89b-12d3-a456-426614174000', firstName: "Mia", lastName: "Anderson", gender: "female" },
            { id: '123e4509-e89b-12d3-a456-426614174000', firstName: "Lucas", lastName: "Thomas", gender: "male" },
            { id: '123e4010-e89b-12d3-a456-426614174000', firstName: "Charlotte", lastName: "Clark", gender: "female" },
            { id: '123e4011-e89b-12d3-a456-426614174000', firstName: "Henry", lastName: "Lewis", gender: "male" },
            { id: '123e4012-e89b-12d3-a456-426614174000', firstName: "Harper", lastName: "Walker", gender: "female" },
            { id: '123e4013-e89b-12d3-a456-426614174000', firstName: "Mason", lastName: "Hall", gender: "male" },
            { id: '123e4014-e89b-12d3-a456-426614174000', firstName: "Ella", lastName: "Young", gender: "female" },
            { id: '123e4015-e89b-12d3-a456-426614174000', firstName: "Logan", lastName: "King", gender: "male" },
            { id: '123e4016-e89b-12d3-a456-426614174000', firstName: "Aria", lastName: "Wright", gender: "female" },
            { id: '123e4017-e89b-12d3-a456-426614174000', firstName: "Jacob", lastName: "Scott", gender: "male" },
            { id: '123e4018-e89b-12d3-a456-426614174000', firstName: "Grace", lastName: "Adams", gender: "female" },
            { id: '123e4019-e89b-12d3-a456-426614174000', firstName: "Jack", lastName: "Nelson", gender: "male" },
        ];

        // -------- USERS DATA --------
        const usersData = [];
        const credentialsData = [];
        const smsData = [];

        // Add owners
        owners.forEach((owner, index) => {
            usersData.push({
                id: owner.id,
                first_name: owner.firstName,
                last_name: owner.lastName,
                dob: '1990-01-01',
                gender: owner.gender,
                address: `${index + 1} Business District, Phnom Penh`,
                role_id: roleMap.owner,
                is_suspended: false,
                createdAt: now,
                updatedAt: now
            });

            credentialsData.push({
                id: uuidv4(),
                username: owner.firstName.toLowerCase(),
                email: `${owner.firstName.toLowerCase()}.${owner.lastName.toLowerCase()}@netjoub.com`,
                password: hashedPassword,
                otp: null,
                otp_expiry: null,
                user_id: owner.id,
                createdAt: now,
                updatedAt: now
            });

            smsData.push({
                id: uuidv4(),
                phone_number: `+85501055056${index + 1}`,
                is_phone_verified: true,
                last_otp_sent_at: now,
                verified_at: now,
                user_id: owner.id,
                createdAt: now,
                updatedAt: now
            });
        });

        // Add customers
        customers.forEach((customer, index) => {
            usersData.push({
                id: customer.id,
                first_name: customer.firstName,
                last_name: customer.lastName,
                dob: '1995-06-15',
                gender: customer.gender,
                address: `Street ${index + 1}, Khan Chamkarmon, Phnom Penh`,
                role_id: roleMap.customer,
                is_suspended: false,
                createdAt: now,
                updatedAt: now
            });

            credentialsData.push({
                id: uuidv4(),
                username: customer.firstName.toLowerCase(),
                email: `${customer.firstName.toLowerCase()}.${customer.lastName.toLowerCase()}@example.com`,
                password: hashedPassword,
                otp: null,
                otp_expiry: null,
                user_id: customer.id,
                createdAt: now,
                updatedAt: now
            });

            smsData.push({
                id: uuidv4(),
                phone_number: `+85501055050${index + 1}`,
                is_phone_verified: true,
                last_otp_sent_at: now,
                verified_at: now,
                user_id: customer.id,
                createdAt: now,
                updatedAt: now
            });
        });

        // Insert data
        if (usersData.length > 0) {
            await queryInterface.bulkInsert('users', usersData);
            console.log(`✓ Seeded ${usersData.length} users (${owners.length} owners, ${customers.length} customers)`);
        }

        if (credentialsData.length > 0) {
            await queryInterface.bulkInsert('credentials', credentialsData);
            console.log(`✓ Seeded ${credentialsData.length} credentials`);
        }

        if (smsData.length > 0) {
            await queryInterface.bulkInsert('sms_credentials', smsData);
            console.log(`✓ Seeded ${smsData.length} SMS credentials`);
        }

        console.log('\n📝 Login Credentials (all use password: Password@123):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('OWNERS (sample):');
        console.log('  Username: james');
        console.log('  Email: james.miller@netjoub.com');
        console.log('  Password: Password@123\n');
        console.log('CUSTOMERS (sample):');
        console.log('  Username: ava');
        console.log('  Email: ava.brown@example.com');
        console.log('  Password: Password@123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    },

    async down(queryInterface, Sequelize) {
        // Delete in reverse order due to foreign key constraints
        await queryInterface.bulkDelete('sms_credentials', {
            phone_number: {
                [Sequelize.Op.like]: '+85501055%'
            }
        });

        await queryInterface.bulkDelete('credentials', {
            email: {
                [Sequelize.Op.or]: [
                    { [Sequelize.Op.like]: '%@netjoub.com' },
                    { [Sequelize.Op.like]: '%@example.com' }
                ]
            }
        });

        await queryInterface.bulkDelete('users', {
            id: {
                [Sequelize.Op.in]: [
                    '123e4561-e89b-12d3-a456-426614174000',
                    '123e4562-e89b-12d3-a456-426614174000',
                    '123e4563-e89b-12d3-a456-426614174000',
                    '123e4564-e89b-12d3-a456-426614174000',
                    '123e4565-e89b-12d3-a456-426614174000',
                    '123e4501-e89b-12d3-a456-426614174000',
                    '123e4502-e89b-12d3-a456-426614174000',
                    '123e4503-e89b-12d3-a456-426614174000',
                    '123e4504-e89b-12d3-a456-426614174000',
                    '123e4505-e89b-12d3-a456-426614174000',
                    '123e4506-e89b-12d3-a456-426614174000',
                    '123e4507-e89b-12d3-a456-426614174000',
                    '123e4508-e89b-12d3-a456-426614174000',
                    '123e4509-e89b-12d3-a456-426614174000',
                    '123e4010-e89b-12d3-a456-426614174000',
                    '123e4011-e89b-12d3-a456-426614174000',
                    '123e4012-e89b-12d3-a456-426614174000',
                    '123e4013-e89b-12d3-a456-426614174000',
                    '123e4014-e89b-12d3-a456-426614174000',
                    '123e4015-e89b-12d3-a456-426614174000',
                    '123e4016-e89b-12d3-a456-426614174000',
                    '123e4017-e89b-12d3-a456-426614174000',
                    '123e4018-e89b-12d3-a456-426614174000',
                    '123e4019-e89b-12d3-a456-426614174000'
                ]
            }
        });

        console.log('✓ Rolled back mock users, credentials, and SMS data');
    }
};