const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Staff = require('./Staff');

const Payroll = sequelize.define('Payroll', {
    Account_no: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Salary: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  Emp_ID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Staff,
      key: 'Emp_ID',
    },
  },
}, {
    tableName: 'Payroll',
    timestamps: false,
  });

Payroll.belongsTo(Staff, { foreignKey: 'Emp_ID' });

module.exports = Payroll;
