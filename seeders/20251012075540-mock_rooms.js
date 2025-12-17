'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        const branches = [
            { id: "a1f5c3d2-9b44-4f7e-8a2e-1b2c3d4e5f60", branch_name: "Tube Coffee Preah Monireth" },
            { id: "b2e6d4f1-7c55-4d8f-9b3f-2c3d4e5f6a71", branch_name: "Starbucks | Total Angkor Phnom Penh" },
            { id: "c3d7e5a2-6d66-4e9f-0c4a-3d4e5f6a7b82", branch_name: "Tube Coffee Samthormuk" },
            { id: "d4f8a6b3-5e77-4f0a-1d5b-4e5f6a7b8c93", branch_name: "Tube Coffee River Side" },
            { id: "e5a9b7c4-4f88-4f1b-2e6c-5f6a7b8c9d04", branch_name: "Tube Coffee Chom Chav" },
            { id: "f6b0c8d5-3f99-4f2a-3f7d-6a7b8c9d0e15", branch_name: "Starbucks | The K Ground" },
            { id: "07c1d9e6-2a10-4f3d-4f8e-7b8c9d0e1f26", branch_name: "Tube Coffee Reach Theany" },
            { id: "18d2eaf7-1b21-4f4e-5f9f-8c9d0e1f2a37", branch_name: "BROWN Roastery | BKK" },
            { id: "29e3fb08-0c32-4f5f-6f0f-9d0e1f2a3b48", branch_name: "BROWN Coffee TTP" },
            { id: "2c3d4e5f-6a71-4b8c-9d0e-1f2a3b4c5e72", branch_name: "TUBE COFFEE + Chroy Changvar" }
        ];

        const allEquipments = ['TV', 'AC', 'Mini fridge', 'Sofa', 'Whiteboard', 'Projector', 'Sound System', 'Coffee Machine'];

        const rooms = [];

        // Predefined static UUIDs for rooms (30 total for 10 branches x 3 rooms each)
        const roomUUIDs = [
            "11111111-1111-1111-1111-111111111111", "11111111-1111-1111-1111-111111111112", "11111111-1111-1111-1111-111111111113",
            "22222222-2222-2222-2222-222222222221", "22222222-2222-2222-2222-222222222222", "22222222-2222-2222-2222-222222222223",
            "33333333-3333-3333-3333-333333333331", "33333333-3333-3333-3333-333333333332", "33333333-3333-3333-3333-333333333333",
            "44444444-4444-4444-4444-444444444441", "44444444-4444-4444-4444-444444444442", "44444444-4444-4444-4444-444444444443",
            "55555555-5555-5555-5555-555555555551", "55555555-5555-5555-5555-555555555552", "55555555-5555-5555-5555-555555555553",
            "66666666-6666-6666-6666-666666666661", "66666666-6666-6666-6666-666666666662", "66666666-6666-6666-6666-666666666663",
            "77777777-7777-7777-7777-777777777771", "77777777-7777-7777-7777-777777777772", "77777777-7777-7777-7777-777777777773",
            "88888888-8888-8888-8888-888888888881", "88888888-8888-8888-8888-888888888882", "88888888-8888-8888-8888-888888888883",
            "99999999-9999-9999-9999-999999999991", "99999999-9999-9999-9999-999999999992", "99999999-9999-9999-9999-999999999993",
            "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
        ];

        let uuidIndex = 0;

        branches.forEach(branch => {
            for (let i = 1; i <= 3; i++) {
                const equipmentCount = Math.floor(Math.random() * 4) + 3; // 3-6 equipments
                const shuffledEquipments = allEquipments.sort(() => 0.5 - Math.random());
                const roomEquipments = shuffledEquipments.slice(0, equipmentCount);

                rooms.push({
                    id: roomUUIDs[uuidIndex++],
                    branch_id: branch.id,
                    room_no: `R${i}0${i}`, // R101, R202, etc.
                    people_capacity: 2 + i,
                    price_per_hour: 50 * i,
                    equipments: roomEquipments,
                    is_available: i % 2 !== 0,
                    createdAt: now,
                    updatedAt: now
                });
            }
        });

        await queryInterface.bulkInsert('rooms', rooms);
        console.log(`✅ Successfully created ${rooms.length} rooms with static UUIDs.`);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('rooms', null, {});
    }
};
