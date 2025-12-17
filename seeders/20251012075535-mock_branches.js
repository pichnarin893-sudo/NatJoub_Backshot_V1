'use strict';

const {v4: uuidv4} = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {

        const now = new Date();


        const owner1 = '123e4561-e89b-12d3-a456-426614174000';
        const owner2 = '123e4562-e89b-12d3-a456-426614174000'
        const owner3 = '123e4563-e89b-12d3-a456-426614174000'
        const owner4 = '123e4564-e89b-12d3-a456-426614174000'
        const owner5 = '123e4565-e89b-12d3-a456-426614174000'


        // Weekdays constant
        const workDays = [
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        ];

        // ---- FIRST OWNER (You already provided full data) ----
        const predefinedBranches = [
            {
                id: "a1f5c3d2-9b44-4f7e-8a2e-1b2c3d4e5f60",
                owner_id: owner1,
                branch_name: "Tube Coffee Preah Monireth",
                work_days: workDays,
                open_times: "07:00:00",
                close_times: "21:00:00",
                room_amount: 5,
                descriptions: "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                address: "48+50 217, Samdech Monireth Blvd (217), Phnom Penh",
                location_url: "https://maps.app.goo.gl/VjJhXdAySnHdke3q8",
                latitude: 11.5552952,
                longitude: 104.9061553,
                lat_long_base_url: "https://www.google.com/maps?q=11.5552952,104.9061553",
                is_active: true,
                createdAt: now,
                updatedAt: now
            },
            {
                id: "b2e6d4f1-7c55-4d8f-9b3f-2c3d4e5f6a71",
                owner_id: owner1,
                branch_name: "Starbucks | Total Angkor Phnom Penh",
                work_days: workDays,
                open_times: "07:00:00",
                close_times: "21:00:00",
                room_amount: 3,
                descriptions: "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                address: "Toul Kork Village, Total Angkor Phnom Penh Gas Station, Angkor Blvd, 120707",
                location_url: "https://maps.app.goo.gl/zJpFXWUT5n7dkRX28",
                latitude: 11.6071462,
                longitude: 104.8873891,
                lat_long_base_url: "https://www.google.com/maps?q=11.6071462,104.8873891",
                is_active: true,
                createdAt: now,
                updatedAt: now
            },

            {
                id: "c3d7e5a2-6d66-4e9f-0c4a-3d4e5f6a7b82",
                owner_id: owner2,
                branch_name: "Tube Coffee Samthormuk",
                work_days: workDays,
                open_times: "07:00:00",
                close_times: "21:00:00",
                room_amount: 5,
                descriptions: "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                address: "639 Kampuchea Krom Blvd (128), Phnom Penh",
                location_url: "https://maps.app.goo.gl/6uUJVbv4XF7pfMLz8",
                latitude: 11.5670352,
                longitude: 104.8982358,
                lat_long_base_url: "https://www.google.com/maps?q=11.5670352,104.8982358",
                is_active: true,
                createdAt: now,
                updatedAt: now
            },
            {
                id: "d4f8a6b3-5e77-4f0a-1d5b-4e5f6a7b8c93",
                owner_id: owner2,
                branch_name: "Tube Coffee River Side",
                work_days: workDays,
                open_times: "07:00:00",
                close_times: "21:00:00",
                room_amount: 5,
                descriptions:
                    "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                address: "385 Preah Sisowath Quay, Phnom Penh",
                location_url: "https://maps.app.goo.gl/YJPps1F5RdmooCBE9",
                latitude: 11.5663735,
                longitude: 104.931805,
                lat_long_base_url: "https://www.google.com/maps?q=11.5663735,104.931805",
                is_active: true,
                createdAt: now,
                updatedAt: now,
            },

            {
                id: "e5a9b7c4-4f88-4f1b-2e6c-5f6a7b8c9d04",
                owner_id: owner3,
                branch_name: "Tube Coffee Chom Chav",
                work_days: workDays,
                open_times: "07:00:00",
                close_times: "21:00:00",
                room_amount: 5,
                descriptions:
                    "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                address: "12405 NR3, Phnom Penh 1240",
                location_url: "https://maps.app.goo.gl/iyqHg6di4ky78YJX8",
                latitude: 11.5238619,
                longitude: 104.8222596,
                lat_long_base_url: "https://www.google.com/maps?q=11.5238619,104.8222596",
                is_active: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: "f6b0c8d5-3f99-4f2a-3f7d-6a7b8c9d0e15",
                owner_id: owner3,
                branch_name: "Starbucks | The K Ground",
                work_days: workDays,
                open_times: "07:00:00",
                close_times: "21:00:00",
                room_amount: 3,
                descriptions:
                    "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                address: "Street 598, Phnom Penh 120705",
                location_url: "https://maps.app.goo.gl/Lo1T79XTJkfVavPM9",
                latitude: 11.6272407,
                longitude: 104.8865108,
                lat_long_base_url: "https://www.google.com/maps?q=11.6272407,104.8865108",
                is_active: true,
                createdAt: now,
                updatedAt: now,
            },

            {
                id: "07c1d9e6-2a10-4f3d-4f8e-7b8c9d0e1f26",
                owner_id: owner4,
                branch_name: "Tube Coffee Reach Theany",
                work_days: workDays,
                open_times: "07:00:00",
                close_times: "21:00:00",
                room_amount: 3,
                descriptions: "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                address: "HV8W+V89, Phnom Penh",
                location_url: "https://maps.app.goo.gl/61cVSyvMbcdfFWpc6",
                latitude: 11.5671674,
                longitude: 104.8958558,
                lat_long_base_url: "https://www.google.com/maps?q=11.5671674,104.8958558",
                is_active: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: "18d2eaf7-1b21-4f4e-5f9f-8c9d0e1f2a37",
                owner_id: owner4,
                branch_name: "BROWN Roastery | BKK",
                work_days: workDays,
                open_times: "07:00:00",
                close_times: "21:00:00",
                room_amount: 3,
                descriptions: "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                address: "st 57 cornered, Oknha Chrun You Hak St. (294), Phnom Penh",
                location_url: "https://maps.app.goo.gl/3BXUDnupuLa4TyZL8",
                latitude: 11.5532865,
                longitude: 104.9248357,
                lat_long_base_url: "https://www.google.com/maps?q=11.5532865,104.9248357",
                is_active: true,
                createdAt: now,
                updatedAt: now,
            },

            {
                id: "29e3fb08-0c32-4f5f-6f0f-9d0e1f2a3b48",
                owner_id: owner5,
                branch_name: "BROWN Coffee TTP",
                work_days: workDays,
                open_times: "07:00:00",
                close_times: "21:00:00",
                room_amount: 3,
                descriptions: "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                address: "175 St 155, Phnom Penh 12310",
                location_url: "https://maps.app.goo.gl/iEs5vZKrvzxi29Le9",
                latitude: 11.5384457,
                longitude: 104.9152644,
                lat_long_base_url: "https://www.google.com/maps?q=11.5384457,104.9152644",
                is_active: true,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: "2c3d4e5f-6a71-4b8c-9d0e-1f2a3b4c5e72",
                    owner_id: owner5,
                    branch_name: "TUBE COFFEE + Chroy Changvar",
                    work_days: workDays,
                    open_times: "07:00:00",
                    close_times: "21:00:00",
                    room_amount: 3,
                    descriptions: "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
                    address: "NR6, Phnom Penh",
                    location_url: "https://maps.app.goo.gl/wKshFuPVYLJ91TSZ6",
                    latitude: 11.5897212,
                    longitude: 104.9281337,
                    lat_long_base_url: "https://www.google.com/maps?q=11.5897212,104.9281337",
                    is_active: true,
                    createdAt: now,
                    updatedAt: now,
            },

            // {
            //     id: "1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4d61",
            //     owner_id: owners[5].id,
            //     branch_name: "Noir Coffee Vattanac",
            //     work_days: workDays,
            //     open_times: "07:00:00",
            //     close_times: "21:00:00",
            //     room_amount: 3,
            //     descriptions: "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
            //     address: "St.108 Corner St.67 Phnom Penh, 12202",
            //     location_url: "https://maps.app.goo.gl/FwL6GCXVD6ULjjiy8",
            //     lat: 11.5725697,
            //     lng: 104.9198753,
            //     lat_long_base_url: "https://www.google.com/maps?q=11.5725697,104.9198753",
            //     is_active: true,
            //     createdAt: now,
            //     updatedAt: now,
            // },
            // {
            //     id: "2c3d4e5f-6a71-4b8c-9d0e-1f2a3b4c5e72",
            //     owner_id: owners[5].id,
            //     branch_name: "TUBE COFFEE + Chroy Changvar",
            //     work_days: workDays,
            //     open_times: "07:00:00",
            //     close_times: "21:00:00",
            //     room_amount: 3,
            //     descriptions: "A cozy coffee shop with private study rooms and open seating areas near SMC campus.",
            //     address: "NR6, Phnom Penh",
            //     location_url: "https://maps.app.goo.gl/wKshFuPVYLJ91TSZ6",
            //     lat: 11.5897212,
            //     lng: 104.9281337,
            //     lat_long_base_url: "https://www.google.com/maps?q=11.5897212,104.9281337",
            //     is_active: true,
            //     createdAt: now,
            //     updatedAt: now,
            // },
        ];

        await queryInterface.bulkInsert('branches', predefinedBranches);

        console.log(`✅ Inserted ${predefinedBranches.length} branches.`);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('branches', null, {});
    }
};
