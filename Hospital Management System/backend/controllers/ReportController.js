const fs = require('fs');
const path = require('path');
const pdf = require('pdf-creator-node');
const nodemailer = require('nodemailer');
const pdfTemplate = require('../documents');
const PdfReport = require('../models/PdfReport');
require('dotenv').config();
const Report = require('../models/PdfReport');
const Staff = require('../models/Staff');
const outputFilePath = path.join(__dirname, '../result.pdf');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const sequelize = require('../config/database'); 
const Bill = require('../models/Bill')
const Visit = require('../models/Visits')
// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});
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
const fetchReportsFromDB = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userRole = req.user.role;

        let reports = [];
        let visits = [];
        
        if (userRole === 'admin') {
            // Fetch all reports for admin
            reports = await PdfReport.findAll({
                include: [
                    {
                        model: Patient, // Include Patient details
                    },
                ],
            });
        } else if (userRole === 'doctor') {
            // Fetch doctor based on email
            const doctor = await getDoctorByEmail(userEmail); 

            // Fetch visits for patients treated by the logged-in doctor
            visits = await Visit.findAll({
                where: { Doctor_ID: doctor.Doctor_ID }, // Filter visits by the logged-in doctor
                include: [
                    {
                        model: Patient, // Include Patient details
                    }
                ],
            });

            const patientIds = visits.map(visit => visit.Patient_ID); // Get patient IDs from visits

            // Fetch reports associated with patients of this doctor
            reports = await PdfReport.findAll({
                where: {
                    Patient_ID: patientIds // Only get reports for patients treated by this doctor
                },
                include: [
                    {
                        model: Patient, // Include Patient details
                    }
                ],
            });
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Send the fetched reports and visits as a response
        res.json({ reports, visits });
    } catch (error) {
        console.error('Error fetching reports and visits from database:', error);
        res.status(500).json({ error: 'Error fetching reports and visits from database' });
    }
};


const findAllReports = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userRole = req.user.role;

        let reports;
        if (userRole === 'admin') {
            // Fetch all reports for admin
            reports = await PdfReport.findAll({
                include: [
                    {
                        model: Patient, // Include Patient details
                    }
                ],
            });
        } else if (userRole === 'patient') {
            // Fetch reports for the logged-in patient
            const patient = await getPatientByEmail(userEmail);
            reports = await PdfReport.findAll({
                where: { Patient_ID: patient.Patient_ID },
                include: [
                    {
                        model: Patient, // Include Patient details
                    }
                ],
            });
        } else if (userRole === 'doctor') {
            // Fetch reports for patients treated by the logged-in doctor
            const doctor = await getDoctorByEmail(userEmail); // Fetch doctor based on email
            reports = await PdfReport.findAll({
                include: [
                    {
                        model: Patient, // Include Patient details
                        where: { Doctor_ID: doctor.Doctor_ID }
                    }
                ],
            });
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const reportsData = reports.map(report => {
            const reportJson = report.toJSON(); // Convert to JSON

            // Return only the specified fields
            return {
                Report_ID: reportJson.Report_ID,
                personal_number: reportJson.personal_number,
                created_at: reportJson.created_at,
                Patient_ID: reportJson.Patient_ID,
                Patient: {
                    Patient_ID: reportJson.Patient.Patient_ID,
                    Personal_Number: reportJson.Patient.Personal_Number,
                    Patient_Fname: reportJson.Patient.Patient_Fname,
                    Birth_Date: reportJson.Patient.Birth_Date,
                    Patient_Lname: reportJson.Patient.Patient_Lname,
                    Blood_type: reportJson.Patient.Blood_type,
                    Email: reportJson.Patient.Email,
                    Gender: reportJson.Patient.Gender,
                    Phone: reportJson.Patient.Phone,
                },
                Patient_Name: `${reportJson.Patient.Patient_Fname} ${reportJson.Patient.Patient_Lname}`
            };
        });

        res.json(reportsData);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const checkPatientReport = async (req, res) => {
    const { patientId } = req.params; // Get the patient ID from the request parameters

    try {
        // Fetch reports for the given patient ID
        const reports = await PdfReport.findAll({
            where: { Patient_ID: patientId },
        });

        // Check if reports exist
        if (reports.length > 0) {
            res.status(200).json({ hasReport: true });
        } else {
            res.status(200).json({ hasReport: false });
        }
    } catch (error) {
        console.error('Error checking patient report:', error);
        res.status(500).json({ error: 'Error checking patient report', message: error.message });
    }
};

const createPdf = async (req, res) => {
    console.log('Request Body:', req.body); // Add this line
    try {
        const {
            personalNumber, patientName, age, patientGender, bloodType, Time, doctorEmail,
            doctorName, email, phone, condition, therapy, dateOfVisit, roomCost,medicineCost  // Include roomCost
        } = req.body;

        // Print the entire roomCost value
        console.log('Room Cost:', roomCost); // Print roomCost here
        console.log('Room Cost:', medicineCost)
        console.log('Doctor Email:', doctorEmail)
        const htmlContent = pdfTemplate({
            personalNumber, patientName, age, patientGender, bloodType, Time, doctorEmail,
            doctorName, email, phone, condition, therapy, dateOfVisit, roomCost, medicineCost // Pass roomCost to template
        });

        const document = {
            html: htmlContent,
            data: {},
            path: outputFilePath,
        };

        const options = {
            format: 'A4',
            orientation: 'portrait',
            border: '10mm',
        };

        await pdf.create(document, options);

        if (!fs.existsSync(outputFilePath)) {
            throw new Error('PDF file was not created');
        }

        res.status(200).sendFile(outputFilePath);
    } catch (error) {
        console.error('Error creating PDF:', error);
        res.status(500).send(`Error creating PDF: ${error.message}`);
    }
};

const sendEmailWithPdf = async (req, res) => {
    try {
        const { email, patientName, roomCost, medicineCost } = req.body; // Include roomCost

        // Print the entire roomCost value
        console.log('Room Cost (Email):', roomCost); // Print roomCost here

        if (!fs.existsSync(outputFilePath)) {
            throw new Error('PDF file not found');
        }

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Patient Report',
            text: `Dear ${patientName},

            Please find the attached patient report for your recent hospital visit.


            If you have any questions or need further assistance, please do not hesitate to contact us.

            Best regards,
            LIFELINE Hospital

            Contact Information:
            - Phone: +38349111222
            - Email: ${process.env.GMAIL_USER}`,
            attachments: [
                {
                    filename: 'patient_report.pdf',
                    path: outputFilePath,
                },
            ],
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).send('Error sending email');
            } else {
                console.log('Email sent:', info.response);
                res.status(200).send('Email sent');
            }
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send(`Error sending email: ${error.message}`);
    }
};

const fetchPdf = (req, res) => {
    if (fs.existsSync(outputFilePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(outputFilePath);
    } else {
        res.status(404).send('PDF not found');
    }
};
const saveReportToDB = async (req, res) => {
    console.log('Received roomCost:', req.body.roomCost);
    try {
        console.log('Request files:', req.files);
        console.log('Request body:', req.body);

        let personalNumber = req.body.personalNumber;
        let patientId = req.body.Patient_ID;
        let roomCost = req.body.roomCost;
        let medicineCost = req.body.medicineCost; // Include roomCost

        console.log('Received personalNumber:', personalNumber);
        console.log('Received Patient_ID:', patientId);
        console.log('Received roomCost:', roomCost); // Log roomCost
        console.log('Received medicineCost:', medicineCost);

        // Ensure personalNumber is a string
        if (typeof personalNumber === 'number') {
            personalNumber = personalNumber.toString();
        }
        
        if (typeof personalNumber !== 'string') {
            throw new Error('personalNumber must be a string');
        }

        // Ensure file is present
        if (!req.files || !req.files.report) {
            throw new Error('PDF report file is missing');
        }

        // Ensure Patient_ID is present
        if (!patientId) {
            throw new Error('Patient_ID is required');
        }

        const pdfReportData = req.files.report.data;

        // Log the data size for debugging
        console.log('PDF report data size:', pdfReportData.length);

        // Create report in the database
        const pdfReport = await PdfReport.create({
            personal_number: personalNumber,
            report: pdfReportData,
            Patient_ID: patientId,
            room_cost: roomCost,
            M_cost: medicineCost // Save roomCost in the database
        });

        res.status(200).json({ message: 'Report saved to database successfully', pdfReport });
    } catch (error) {
        console.error('Error saving report to database:', error);
        res.status(500).json({ error: 'Error saving report to database', message: error.message });
    }
};



const deleteReport = async (req, res) => {
    const transaction = await sequelize.transaction(); // Start a transaction
    try {
        // Find the report to get the associated patient ID
        const report = await Report.findOne({
            where: { Report_ID: req.params.id },
            transaction // Use the transaction for this query
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Retrieve the associated patient ID
        const patientId = report.Patient_ID; // Adjust this line based on your Report model

        // Delete the associated bill for the patient
        const deletedBill = await Bill.destroy({
            where: { Patient_ID: patientId },
            transaction // Use the transaction for this delete
        });

        // Delete the report
        const deletedReport = await Report.destroy({
            where: { Report_ID: req.params.id },
            transaction // Use the transaction for this delete
        });

        // Commit the transaction if both deletes were successful
        await transaction.commit();

        res.json({ success: true, message: 'Report and associated bill deleted successfully' });
    } catch (error) {
        await transaction.rollback(); // Roll back the transaction on error
        console.error('Error deleting report or bill:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createPdf,
    sendEmailWithPdf,
    fetchPdf,
    saveReportToDB,
    fetchReportsFromDB,
    deleteReport,
    checkPatientReport,
    findAllReports
};
