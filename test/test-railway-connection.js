const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.railway
dotenv.config({ path: path.join(__dirname, '.env.railway') });

console.log('Testing Railway Postgres connection...');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);
console.log('');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    connectionTimeoutMillis: 5000, // 5 second timeout
});

client.connect()
    .then(() => {
        console.log('✓ Successfully connected to Railway Postgres!');
        return client.query('SELECT version()');
    })
    .then((result) => {
        console.log('✓ Database version:', result.rows[0].version);
        return client.end();
    })
    .then(() => {
        console.log('✓ Connection closed');
        process.exit(0);
    })
    .catch((err) => {
        console.error('✗ Connection failed:', err.message);
        console.error('');
        console.error('Possible issues:');
        console.error('1. DB_HOST is set to "postgres.railway.internal" (internal only)');
        console.error('2. Use the PUBLIC connection URL from Railway Dashboard');
        console.error('3. Check if your IP is whitelisted (if Railway requires it)');
        process.exit(1);
    });
