// const Bill = require('../models/Bill');
// const Medicine = require('../models/Medicine');
// const Room = require('../models/Room');
// const Visit = require('../models/Visits');  // Assuming you have a Visit model
// const sequelize = require('../config/database');  // Import your sequelize instance
// const Patient = require('../models/Patient');
// const { Op } = require('sequelize');

const Bill = require('../models/Bill');
const Medicine = require('../models/Medicine');
const Room = require('../models/Room');
const Visit = require('../models/Visits');  // Assuming you have a Visit model
const PdfReport = require('../models/PdfReport');  // Assuming you have a Report model
const sequelize = require('../config/database');  // Import your sequelize instance
const Patient = require('../models/Patient');
const { Op } = require('sequelize');
const Staff = require('../models/Staff');
const Doctor = require('../models/Doctor');

const DeleteBill = async (req, res) => {
    const transaction = await sequelize.transaction();  // Start a transaction

    try {
        // Find the bill to get the associated patient ID
        const bill = await Bill.findOne({
            where: { Bill_ID: req.params.id },
            transaction, // Use the transaction for this query
        });

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        const patientId = bill.Patient_ID;

        // Delete the bill
        const deletedBill = await Bill.destroy({
            where: { Bill_ID: req.params.id },
            transaction, // Use the transaction for this delete
        });

        if (deletedBill === 0) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Delete the associated visit for the same patient
        const deletedVisit = await Visit.destroy({
            where: { Patient_ID: patientId },
            transaction, // Use the transaction for this delete
        });

        // Delete associated room for the patient
        await Room.destroy({
            where: { Patient_ID: patientId },
            transaction, // Use the transaction for this delete
        });

        // Delete associated medicines for the patient
        await Medicine.destroy({
            where: { Patient_ID: patientId },
            transaction, // Use the transaction for this delete
        });

        // Delete associated report for the patient
        await PdfReport.destroy({
            where: { Patient_ID: patientId },
            transaction, // Use the transaction for this delete
        });

        // Commit the transaction if all deletes were successful
        await transaction.commit();

        res.json({ success: true, message: 'Bill, associated visit, room, medicines, and report deleted successfully' });
    } catch (error) {
        // Roll back the transaction on error
        await transaction.rollback();
        console.error('Error deleting bill, visit, room, medicines, or report:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getDoctorByEmail = async (email) => {
    try {
        // Fetch the staff member with the given email
        const staff = await Staff.findOne({
            where: { Email: email } // Check the email in the Staff table
        });

        if (!staff) {
            throw new Error('Staff member not found');
        }

        // Fetch the doctor associated with the staff member
        const doctor = await Doctor.findOne({
            where: { Emp_ID: staff.Emp_ID } // Use Emp_ID to find the associated doctor
        });

        if (!doctor) {
            throw new Error('Doctor not found');
        }

        return doctor;
    } catch (error) {
        console.error('Error fetching doctor by email:', error);
        throw error;
    }
};
const getPatientByEmail = async (email) => {
    try {
        const patient = await Patient.findOne({
            where: { Email: email }
        });

        if (!patient) {
            throw new Error('Patient not found');
        }

        return patient;
    } catch (error) {
        console.error('Error fetching patient by email:', error);
        throw error;
    }
};

const FindAllBills = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userRole = req.user.role;

        let bills;
        if (userRole === 'admin') {
            // Admin can see all bills
            bills = await Bill.findAll({
                include: [
                    {
                        model: Patient,
                        attributes: ['Patient_Fname', 'Patient_Lname']
                    }
                ]
            });
        } else if (userRole === 'patient') {
            // Patient can see their own bills
            const patient = await getPatientByEmail(userEmail);
            bills = await Bill.findAll({
                where: { Patient_ID: patient.Patient_ID },
                include: [
                    {
                        model: Patient,
                        attributes: ['Patient_Fname', 'Patient_Lname']
                    }
                ]
            });
        } else if (userRole === 'doctor') {
            // Fetch doctor based on email
            const doctor = await getDoctorByEmail(userEmail);

            // Fetch visits for patients treated by the logged-in doctor
            const visits = await Visit.findAll({
                where: { Doctor_ID: doctor.Doctor_ID }, // Filter visits by the logged-in doctor
                include: [
                    {
                        model: Patient, // Include Patient details
                        attributes: ['Patient_ID'] // Only include Patient_ID for filtering
                    }
                ],
            });

            const patientIds = visits.map(visit => visit.Patient.Patient_ID); // Get patient IDs from visits

            // Fetch bills associated with patients who have visits
            bills = await Bill.findAll({
                where: {
                    Patient_ID: patientIds // Only get bills for patients who have visits
                },
                include: [
                    {
                        model: Patient,
                        attributes: ['Patient_Fname', 'Patient_Lname']
                    }
                ]
            });
        } else {
            // If the user role is not recognized, return forbidden
            return res.status(403).json({ error: 'Forbidden' });
        }

        const billsDataWithNames = bills.map(bill => ({
            ...bill.toJSON(),
            Patient_Name: bill.Patient ? `${bill.Patient.Patient_Fname} ${bill.Patient.Patient_Lname}` : 'Unknown Patient'
        }));

        res.json({ bills: billsDataWithNames });
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




const FindSingleBill = async (req, res) => {
    try {
        const bill = await Bill.findByPk(req.params.id, {
            include: [Patient]
        });
        if (!bill) {
            res.status(404).json({ error: 'Bill not found' });
            return;
        }
        res.json(bill);
    } catch (error) {
        console.error('Error fetching single bill:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const AddBill = async (req, res) => {
    try {
        const {
            Patient_ID,
            Date_Issued,
            Description,
            Amount,
            Payment_Status
        } = req.body;

        // Validations
        if (!Date_Issued || !Amount || !Patient_ID) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if Date_Issued is in the past or today
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Set to midnight

        const issuedDate = new Date(Date_Issued);
        issuedDate.setHours(0, 0, 0, 0); // Set to midnight

        if (issuedDate < currentDate) {
            return res.status(400).json({ error: 'Date_Issued cannot be in the past or today' });
        }

        // Check if the patient already has a bill
        const existingBill = await Bill.findOne({ where: { Patient_ID } });
        if (existingBill) {
            return res.status(400).json({ error: 'A bill already exists for this patient' });
        }

        // Create new bill if no existing bill is found
        const newBill = await Bill.create({
            Patient_ID,
            Date_Issued,
            Description,
            Amount,
            Payment_Status
        });

        res.json({ success: true, message: 'Bill added successfully', data: newBill });
    } catch (error) {
        console.error('Error adding bill:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const UpdateBill = async (req, res) => {
    try {
        const {
            Date_Issued,
            Description,
            Amount,
            Payment_Status,
            Patient_ID // Include Patient_ID here
        } = req.body;

        // Validations
        if (!Date_Issued || !Amount || !Patient_ID) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if Date_Issued is in the past or today
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Set to midnight

        const issuedDate = new Date(Date_Issued);
        issuedDate.setHours(0, 0, 0, 0); // Set to midnight

        if (issuedDate < currentDate) {
            return res.status(400).json({ error: 'Date_Issued cannot be in the past or today' });
        }

        // Check if the patient already has a different bill (other than the current one being updated)
        const existingBill = await Bill.findOne({
            where: {
                Patient_ID,
                Bill_ID: { [Op.ne]: req.params.id } // Exclude the current bill from the check
            }
        });

        // If another bill exists for this patient, prevent the update
        if (existingBill) {
            return res.status(400).json({ error: 'This patient already has another bill' });
        }

        // Proceed with updating the current bill
        const updated = await Bill.update(
            {
                Date_Issued,
                Description,
                Amount,
                Payment_Status,
                Patient_ID // Include Patient_ID in the update
            },
            { where: { Bill_ID: req.params.id } }
        );

        if (updated[0] === 0) {
            return res.status(404).json({ error: 'Bill not found or not updated' });
        }
        
        res.json({ success: true, message: 'Bill updated successfully' });
    } catch (error) {
        console.error('Error updating bill:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};








module.exports = {
    FindAllBills,
    FindSingleBill,
    AddBill,
    UpdateBill,
    DeleteBill,
};
