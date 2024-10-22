const Department = require('../models/Department');
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

const FindAllDepartments = async (req, res) => {
    try {
        const userEmail = req.user.email; // Get the user's email from the request
        const userRole = req.user.role; // Get the user's role from the request

        // If user is a doctor or any staff, fetch their department
        if (userRole === 'doctor' ) {
            // const staff = await getStaffByEmail(userEmail); // Fetch staff by email
            // const departments = await Department.findAll({
            //     where: { Dept_ID: staff.Dept_ID }, // Filter by the staff's department ID
            // });
            const departments = await Department.findAll();
            return res.json(departments); // Return the found departments
        }

        // If user is an admin, return all departments
        if (userRole === 'admin') {
            const departments = await Department.findAll();
            return res.json(departments);
        }

        return res.status(403).json({ error: 'Forbidden' });
    } catch (error) {
        console.error('Error fetching departments:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


// module.exports = {
//     FindAllDepartments,
//     getStaffByEmail,
// };


    const FindSingleDepartment = async (req, res) => {
        try {
            const department = await Department.findByPk(req.params.id);
            if (!department) {
                res.status(404).json({ error: 'Department not found' });
                return;
            }
            res.json(department);
        } catch (error) {
            console.error('Error fetching single department:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    const AddDepartment = async (req, res) => {
        try {
            const { Dept_head, Dept_name, Emp_Count } = req.body;
            // Validate input fields
        if (!Dept_head || !Dept_name || !Emp_Count) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (Dept_head.length < 2) {
            return res.status(400).json({ error: 'Department head must be at least 2 characters long' });
        }

        if (Dept_name.length < 2) {
            return res.status(400).json({ error: 'Department name must be at least 2 characters long' });
        }

        if (parseInt(Emp_Count) < 1 || isNaN(parseInt(Emp_Count))) {
            return res.status(400).json({ error: 'Employee count must be at least 1' });
        }

        // Check if the department already exists
        const existingDepartment = await Department.findOne({ where: { Dept_name } });
        if (existingDepartment) {
            return res.status(400).json({ error: 'Department with the same name already exists' });
        } 

            const newDepartment = await Department.create({
                Dept_head,
                Dept_name,
                Emp_Count,
            });
            res.json({ success: true, message: 'Department added successfully', data: newDepartment });
        } catch (error) {
            console.error('Error adding department:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
  
    const UpdateDepartment = async (req, res) => {
        try {
            const { Dept_head, Dept_name, Emp_Count } = req.body;
    
            // Validate input fields
            if (!Dept_head || !Dept_name || !Emp_Count) {
                return res.status(400).json({ error: 'All fields are required' });
            }
    
            if (Dept_head.length < 2) {
                return res.status(400).json({ error: 'Department head must be at least 2 characters long' });
            }
    
            if (Dept_name.length < 2) {
                return res.status(400).json({ error: 'Department name must be at least 2 characters long' });
            }
    
            if (parseInt(Emp_Count) < 1 || isNaN(parseInt(Emp_Count))) {
                return res.status(400).json({ error: 'Employee count must be at least 1' });
            }
    
            // Check if the new department name already exists in another department
            const existingDepartment = await Department.findOne({
                where: {
                    Dept_name,
                    Dept_ID: { [Op.ne]: req.params.id } // Exclude the current department being updated
                }
            });
    
            if (existingDepartment) {
                return res.status(400).json({ error: 'Department with the same name already exists' });
            }
    
            const updated = await Department.update(
                { Dept_head, Dept_name, Emp_Count },
                { where: { Dept_ID: req.params.id } }
            );
    
            if (updated[0] === 0) {
                res.status(404).json({ error: 'Department not found or not updated' });
                return;
            }
    
            res.json({ success: true, message: 'Department updated successfully' });
        } catch (error) {
            console.error('Error updating department:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    

    const DeleteDepartment = async (req, res) => {
        try {
            const deleted = await Department.destroy({
                where: { Dept_ID: req.params.id },
            });
            if (deleted === 0) {
                res.status(404).json({ error: 'Department not found' });
                return;
            }
            res.json({ success: true, message: 'Department deleted successfully' });
        } catch (error) {
            console.error('Error deleting department:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    


module.exports = {
    FindAllDepartments,
    FindSingleDepartment,
    AddDepartment,
    UpdateDepartment,
    DeleteDepartment
};