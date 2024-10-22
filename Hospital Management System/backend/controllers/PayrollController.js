const Payroll = require('../models/Payroll');
const Staff = require('../models/Staff');

const getStaffByEmail = async (email) => {
    try {
        const staff = await Staff.findOne({
            where: { Email: email }
        });

        if (!staff) {
            throw new Error('Staff not found');
        }

        return staff;
    } catch (error) {
        console.error('Error fetching staff by email:', error);
        throw error;
    }
};

const FindAllPayroll = async (req, res) => {
    try {
        const userEmail = req.user.email;  // Get the logged-in user's email
        const userRole = req.user.role;     // Get the logged-in user's role

        let payrolls;
        if (userRole === 'admin') {
            // Admin can see all payrolls
            payrolls = await Payroll.findAll({
                include: {
                    model: Staff, // Include staff details
                },
            });
        } else if (userRole === 'doctor') {
            // Fetch payrolls for the logged-in staff member
            const staff = await getStaffByEmail(userEmail);
            payrolls = await Payroll.findAll({
                where: { Emp_ID: staff.Emp_ID }, // Filter by Emp_ID
                include: {
                    model: Staff, // Include staff details
                },
            });
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const payrollsDataWithStaffNames = payrolls.map(payroll => ({
            ...payroll.toJSON(),
            Staff_Name: payroll.Staff ? `${payroll.Staff.Staff_Fname} ${payroll.Staff.Staff_Lname}` : 'Unknown Staff'
        }));

        res.json(payrollsDataWithStaffNames);
    } catch (error) {
        console.error('Error fetching all payrolls:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const FindSinglePayroll = async (req, res) => {
    try {
        const payroll = await Payroll.findByPk(req.params.id);
        if (!payroll) {
            return res.status(404).json({ error: 'Payroll not found' });
        }
        res.json(payroll);
    } catch (error) {
        console.error('Error fetching single payroll:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const AddPayroll = async (req, res) => {
    try {
        const { Salary, Emp_ID } = req.body;

        // Validation
        if (!Emp_ID || !Salary) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (Emp_ID < 1) {
            return res.status(400).json({ error: 'Staff ID cannot be less than 1' });
        }

        // Check if payroll already exists for the employee
        const existingPayroll = await Payroll.findOne({ where: { Emp_ID } });
        if (existingPayroll) {
            return res.status(400).json({ error: `Employee already has a payroll` });
        }

        const newPayroll = await Payroll.create({
            Salary,
            Emp_ID,
        });
        res.json({ success: true, message: 'Payroll added successfully', data: newPayroll });
    } catch (error) {
        console.error('Error adding payroll:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const UpdatePayroll = async (req, res) => {
    try {
        const { Salary, Emp_ID } = req.body;

        // Validation
        if (!Salary || !Emp_ID) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (Emp_ID < 1) {
            return res.status(400).json({ error: 'Staff ID cannot be less than 1' });
        }

        // Check if the payroll already exists for another employee
        const existingPayroll = await Payroll.findOne({ where: { Emp_ID } });
        if (existingPayroll && existingPayroll.Account_no !== parseInt(req.params.id)) {
            return res.status(400).json({ error: `Employee already has a payroll` });
        }

        const updated = await Payroll.update(
            { Salary, Emp_ID },
            { where: { Account_no: req.params.id } }
        );
        if (updated[0] === 0) {
            return res.status(404).json({ error: 'Payroll not found or not updated' });
        }
        res.json({ success: true, message: 'Payroll updated successfully' });
    } catch (error) {
        console.error('Error updating payroll:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const DeletePayroll = async (req, res) => {
    try {
        const deleted = await Payroll.destroy({
            where: { Account_no: req.params.id },
        });
        if (deleted === 0) {
            return res.status(404).json({ error: 'Payroll not found' });
        }
        res.json({ success: true, message: 'Payroll deleted successfully' });
    } catch (error) {
        console.error('Error deleting payroll:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    FindAllPayroll,
    FindSinglePayroll,
    AddPayroll,
    UpdatePayroll,
    DeletePayroll,
    getStaffByEmail
};
