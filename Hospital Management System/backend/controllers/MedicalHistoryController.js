const MedicalHistory = require('../models/MedicalHistory');
const Patient = require('../models/Patient');
const { Op } = require('sequelize'); 
const Staff = require('../models/Staff');
const Doctor = require('../models/Doctor');
const Bill = require('../models/Bill');
const Visit = require('../models/Visits'); 
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
const FindAllMedicalHistorys = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userRole = req.user.role;

        let medicalHistories;
        if (userRole === 'admin') {
            // Admin can see all medical histories
            medicalHistories = await MedicalHistory.findAll({
                include: {
                    model: Patient,
                    attributes: ['Patient_Fname', 'Patient_Lname']
                },
            });
        } else if (userRole === 'patient') {
            // Patient can see their own medical histories
            const patient = await getPatientByEmail(userEmail);
            medicalHistories = await MedicalHistory.findAll({
                where: { Patient_ID: patient.Patient_ID },
                include: {
                    model: Patient,
                    attributes: ['Patient_Fname', 'Patient_Lname']
                },
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

            // Fetch medical histories associated with patients who have visits
            medicalHistories = await MedicalHistory.findAll({
                where: {
                    Patient_ID: patientIds // Only get medical histories for patients who have visits
                },
                include: {
                    model: Patient,
                    attributes: ['Patient_Fname', 'Patient_Lname']
                }
            });
        } else {
            // If the user role is not recognized, return forbidden
            return res.status(403).json({ error: 'Forbidden' });
        }

        const medicalHistoriesDataWithNames = medicalHistories.map(medicalHistory => ({
            ...medicalHistory.toJSON(),
            Patient_Name: medicalHistory.Patient ? `${medicalHistory.Patient.Patient_Fname} ${medicalHistory.Patient.Patient_Lname}` : 'Unknown Patient'
        }));

        res.json({ medicalHistories: medicalHistoriesDataWithNames });
    } catch (error) {
        console.error('Error fetching medical histories:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const FindSingleMedicalHistory = async (req, res) => {
    try {
        const medicalHistory = await MedicalHistory.findByPk(req.params.id, {
            include: {
                model: Patient
            }
        });
        if (!medicalHistory) {
            res.status(404).json({ error: 'Medical history not found' });
            return;
        }
        res.json(medicalHistory);
    } catch (error) {
        console.error('Error fetching single medical history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const AddMedicalHistory = async (req, res) => {
    try {
        const { Patient_ID, Allergies, Pre_Conditions } = req.body;

        // Validation logic
        if (!Patient_ID || !Allergies || !Pre_Conditions) {
            return res.status(400).json({ error: 'Patient ID, Allergies, and Pre-Conditions are required.' });
        }

        // Check if medical history already exists for this patient
        const existingHistory = await MedicalHistory.findOne({ where: { Patient_ID } });

        if (existingHistory) {
            return res.status(400).json({ error: 'This patient already has a medical history.' });
        }

        const newMedicalHistory = await MedicalHistory.create({
            Patient_ID,
            Allergies,
            Pre_Conditions
        });

        res.json({ success: true, message: 'Medical history added successfully', data: newMedicalHistory });
    } catch (error) {
        console.error('Error adding medical history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const UpdateMedicalHistory = async (req, res) => {
    try {
        const { Patient_ID, Allergies, Pre_Conditions } = req.body;

        // Find if there is another medical history for the same patient but with a different Record_ID
        const existingHistory = await MedicalHistory.findOne({ where: { Patient_ID, Record_ID: { [Op.ne]: req.params.id } } });

        if (existingHistory) {
            return res.status(400).json({ error: 'This patient already has a medical history.' });
        }

        const updated = await MedicalHistory.update(
            { Patient_ID, Allergies, Pre_Conditions },
            { where: { Record_ID: req.params.id } }
        );

        if (updated[0] === 0) {
            return res.status(404).json({ error: 'Medical history not found or not updated' });
        }

        res.json({ success: true, message: 'Medical history updated successfully' });
    } catch (error) {
        console.error('Error updating medical history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const DeleteMedicalHistory = async (req, res) => {
    try {
        const medicalHistoryId = req.params.id;
        console.log('Deleting medical history with ID:', medicalHistoryId); // Log the ID received from the client

        const deleted = await MedicalHistory.destroy({
            where: { Record_ID: medicalHistoryId }
        });

        if (deleted === 0) {
            res.status(404).json({ error: 'Medical history not found' });
            return;
        }

        res.json({ success: true, message: 'Medical history deleted successfully' });
    } catch (error) {
        console.error('Error deleting medical history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    FindAllMedicalHistorys,
    FindSingleMedicalHistory,
    AddMedicalHistory,
    UpdateMedicalHistory,
    DeleteMedicalHistory,
};
