// Load appropriate .env file based on environment
const path = require('path');
const dotenv = require('dotenv');

// If NODE_ENV is production and .env.railway exists, use it
// Otherwise, use default .env file
if (process.env.NODE_ENV === 'production') {
    const railwayEnvPath = path.join(__dirname, '../.env.railway');
    const fs = require('fs');
    if (fs.existsSync(railwayEnvPath)) {
        console.log('Loading .env.railway for production');
        dotenv.config({ path: railwayEnvPath });
    } else {
        // On Railway deployment, variables come from Railway Dashboard
        console.log('Using Railway Dashboard environment variables');
    }
} else {
    dotenv.config();
}

const baseConfig = {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
    },

};

const testConfig = {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
    },

};

const productionConfig = {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
    },

};


module.exports = {
    development: baseConfig,
    test: testConfig,
    production: productionConfig,
};