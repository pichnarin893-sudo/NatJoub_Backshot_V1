'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js' &&
            file.indexOf('.test.js') === -1
        );
    })
    .forEach(file => {
        // const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        // // CHANGED: Use modelName instead of name
        // db[model.modelName || model.name] = model;

        const filePath = path.join(__dirname, file);
        const modelDef = require(filePath);

        let model = null;
        // support both commonjs export (function) and transpiled ESM default export
        if (typeof modelDef === 'function') {
        model = modelDef(sequelize, Sequelize.DataTypes);
        } else if (modelDef && typeof modelDef.default === 'function') {
        model = modelDef.default(sequelize, Sequelize.DataTypes);
        } else {
        console.warn(`Skipping model file ${file} — exported value is not a function`);
        return;
        }

        // model should be defined now
        if (model && model.name) {
        db[model.name] = model;
        } else if (model && model.modelName) { // fallback
        db[model.modelName] = model;
        } else {
        console.warn(`Model from file ${file} did not expose a name or modelName`);
        }

    });

// Add debug logging temporarily
console.log('Loaded models:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
