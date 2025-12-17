'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class aba_transactions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define the association to the User model here
      aba_transactions.belongsTo(models.users, {
        foreignKey: 'userId', // The foreign key column in THIS model
        as: 'user' // Alias for the association
      });
    }
  }

  aba_transactions.init({
    // Primary Key (typically automatically handled, but good practice to define)
    id: {
      type: DataTypes.UUID,
      // autoIncrement: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    // Transaction ID (Unique String)
    tranId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true // Assuming transaction IDs must be unique
    },
    // Invoice Reference
    invoice: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Foreign Key linking to the 'Users' model
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users', // This refers to the table name (often plural)
        key: 'id'
      }
    },
    // QR String
    qrString: {
      type: DataTypes.STRING,
      allowNull: true // Assuming it might be generated after creation
    },
    // QR Image URL or Data
    qrImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Transaction Status using ENUM
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'refund'),
      allowNull: false,
      defaultValue: 'pending' // Default status when created
    }
  }, {
    sequelize,
    modelName: 'aba_transactions', // The model name
    tableName: 'aba_transactions', // Explicitly define the table name
  });

  return aba_transactions;
};