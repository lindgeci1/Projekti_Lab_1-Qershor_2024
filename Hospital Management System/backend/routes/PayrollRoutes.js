const express = require("express");
const {
    FindAllPayroll,
    FindSinglePayroll,
    AddPayroll,
    UpdatePayroll,
    DeletePayroll,
} = require("../controllers/PayrollController");
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get("/payroll", authenticateToken(['admin', 'doctor', 'patient']), FindAllPayroll);
router.get("/payroll/:id", authenticateToken(['admin', 'doctor', 'patient']), FindSinglePayroll);
router.post("/payroll/create",  authenticateToken(['admin', 'doctor', 'patient']), AddPayroll);
router.put("/payroll/update/:id",  authenticateToken(['admin', 'doctor', 'patient']), UpdatePayroll);
router.delete("/payroll/delete/:id", DeletePayroll);

module.exports = router;
