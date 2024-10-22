const express = require("express");
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
    FindAllPatients, 
    FindSinglepatientPatient, 
    AddPatient, 
    UpdatePatient, 
    DeletePatient,
    CheckPatientExistence, 
    FindPatientByPersonalNumber,
    FindRoomCostByPatientId, // Import the new function,
    FindMedicineCostByPatientId,
    FindEmailByPatientId,
    CheckPatientVisit
} = require("../controllers/PatientController");

// Define the routes
router.get("/patient", authenticateToken(['admin', 'doctor', 'patient']), FindAllPatients);
router.get("/patient/:id", authenticateToken(['admin', 'doctor', 'patient']), FindSinglepatientPatient);
router.post("/patient/create", authenticateToken(['admin', 'doctor', 'patient']), AddPatient);
router.put("/patient/update/:id", authenticateToken(['admin', 'doctor', 'patient']), UpdatePatient);
router.delete("/patient/delete/:id", DeletePatient);
router.get('/patient/check/:id', authenticateToken(['admin', 'doctor', 'patient']), CheckPatientExistence); 
router.get('/patient/personalNumber/:personalNumber', authenticateToken(['admin', 'doctor', 'patient']), FindPatientByPersonalNumber);

// New route to get room cost by patient ID
router.get('/patient/:patientId/room-cost', authenticateToken(['admin', 'doctor', 'patient']), FindRoomCostByPatientId);
router.get('/patients/:patientId/medicine-cost', authenticateToken(['admin', 'doctor', 'patient']),FindMedicineCostByPatientId); // Add this line
router.get('/patient/:patientId/email', authenticateToken(['admin', 'doctor', 'patient']),FindEmailByPatientId);
router.get('/patient/:id/visit', authenticateToken(['admin', 'doctor', 'patient']), CheckPatientVisit);
module.exports = router;
