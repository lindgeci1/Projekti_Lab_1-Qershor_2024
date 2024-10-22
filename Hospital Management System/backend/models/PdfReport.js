const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');

const PdfReport = sequelize.define('PdfReport', {
  Report_ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  personal_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  report: {
    type: DataTypes.BLOB('long'), // Adjust this based on your needs
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  Patient_ID: {
    type: DataTypes.INTEGER,
    references: {
      model: 'patient', // Refer to the patient table
      key: 'Patient_ID', // Refer to the correct field in the patient table
    },
  },
}, {
  tableName: 'reports',
  timestamps: false,
});

PdfReport.belongsTo(Patient, { foreignKey: 'Patient_ID' });
module.exports = PdfReport;
