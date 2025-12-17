const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    console.log(`Hashed Password: ${hashedPassword}`);
}

hashPassword('pich21'); // Replace with your actual admin password