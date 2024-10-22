const Staff = require('../models/Staff');
const Department = require('../models/Department');
const { Op } = require('sequelize');
const Visit = require('../models/Visits');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');  // Import Doctor model
const Nurse = require('../models/Nurse');    // Import Nurse model
const { Sequelize } = require('sequelize');
const User = require('../models/User');
const getDoctorByStaffEmail = async (email) => {
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
        console.error('Error fetching doctor by staff email:', error);
        throw error;
    }
};

const FindAllStaff = async (req, res) => {
    try {
        const userEmail = req.user.email; // Get the logged-in user's email
        const userRole = req.user.role;   // Get the logged-in user's role

        let staffMembers;

        if (userRole === 'admin') {
            // Admin can fetch all staff members
            staffMembers = await Staff.findAll({
                include: [{
                    model: Department
                }]
            });
        } else if (userRole === 'doctor') {
            // Doctor or Nurse can fetch their own details
            const doctor = await getDoctorByStaffEmail(userEmail);
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }
            staffMembers = await Staff.findAll({
                where: { Emp_ID: doctor.Emp_ID }, // Fetch staff associated with this doctor
                include: [{
                    model: Department
                }]
            });
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(staffMembers);
    } catch (error) {
        console.error('Error fetching all staff:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
// Utility function to validate email format
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};



const FindSingleStaff = async (req, res) => {
    try {
        const staff = await Staff.findByPk(req.params.id);
        if (!staff) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }
        res.json(staff);
    } catch (error) {
        console.error('Error fetching single staff:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const FindNurses = async (req, res) => {
    try {
        const nurses = await Staff.findAll({
            where: { Emp_type: 'nurse' },
            include: [{
                model: Department,
                attributes: ['Dept_name'] 
            }]
        });
        res.json(nurses);
    } catch (error) {
        console.error('Error fetching nurses:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const FindDoctors = async (req, res) => {
    try {
        const doctors = await Staff.findAll({
            where: { Emp_type: 'doctor' },
            include: [{
                model: Department,
                attributes: ['Dept_name'] 
            }]
        });
        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const AddStaff = async (req, res) => {
    try {
        const { Emp_Fname, Emp_Lname, Joining_Date, Emp_type, Email, Address, Dept_ID, DOB, Qualifications, Specialization, Patient_ID } = req.body;

        // Validate input fields
        if (!Emp_Fname || !Emp_Lname || !Joining_Date || !Emp_type || !Email || !Address || !Dept_ID || !DOB || !Qualifications || !Specialization) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        if (!validateEmail(Email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if a staff member with the same Email, First Name, and Last Name already exists
        const existingStaff = await Staff.findOne({ 
            where: { 
                Email,
                Emp_Fname,
                Emp_Lname 
            }
        });
        
        if (existingStaff) {
            return res.status(400).json({ error: 'Staff member with the same Email, First Name, and Last Name already exists' });
        }

        // Check if the department exists
        const department = await Department.findOne({ where: { Dept_ID } });
        if (!department) {
            return res.status(400).json({ error: 'Department not found' });
        }

        const existingEmail = await Staff.findOne({ where: { Email } });
        if (existingEmail) {
            return res.status(400).json({ error: 'Staff member with the same Email already exists' });
        }

                // Fetch the user by email
                const user = await User.findOne({
                    where: { email: Email }
                });
        
                let userId = null;
                if (user) {
                    userId = user.user_id; // Get the user_id from the existing user
                } else {
                    // If the user does not exist, you can choose to handle this case
                    // For example, you can create a new user or return an error
                    return res.status(400).json({ error: 'No user found with the provided email.' });
                }
        // Create the staff member in the 'staff' table
        const newStaff = await Staff.create({
            Emp_Fname,
            Emp_Lname,
            Joining_Date,
            Emp_type,
            Email,
            Address,
            Dept_ID,
            DOB,
            Qualifications,
            Specialization,
            user_id: userId
        });

        // Handle Doctor type
        if (Emp_type === 'Doctor') {
            console.log('Creating a doctor record...');
            const doctorQualifications = Qualifications || 'testtest';
            const doctorSpecialization = Specialization || 'testtest';

            await Doctor.create({
                Emp_ID: newStaff.Emp_ID, // Use the Emp_ID as foreign key
                Qualifications: doctorQualifications,
                Specialization: doctorSpecialization
            });
        }

        res.json({ success: true, message: 'Staff added successfully', data: newStaff });
    } catch (error) {
        console.error('Error adding staff:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const UpdateStaff = async (req, res) => {
    try {
        const { Emp_Fname, Emp_Lname, Joining_Date, Emp_type, Email, Address, Dept_ID, DOB, Qualifications, Specialization, Patient_ID } = req.body;

        // Validate input fields
        if (!Emp_Fname || !Emp_Lname || !Joining_Date || !Emp_type || !Email || !Address || !Dept_ID || !DOB || !Qualifications || !Specialization) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        if (!validateEmail(Email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if a staff member with the same Email, First Name, and Last Name already exists (excluding the current staff member)
        const existingStaff = await Staff.findOne({
            where: {
                Email,
                Emp_Fname,
                Emp_Lname,
                Emp_ID: { [Sequelize.Op.ne]: req.params.id } // Use Sequelize.Op.ne to exclude the current staff member
            }
        });

        if (existingStaff) {
            return res.status(400).json({ error: 'Staff member with the same Email, First Name, and Last Name already exists' });
        }

        // Check if a staff member with the same Email exists (excluding the current staff member)
        const existingEmail = await Staff.findOne({
            where: {
                Email,
                Emp_ID: { [Sequelize.Op.ne]: req.params.id } // Use Sequelize.Op.ne to exclude the current staff member
            }
        });

        if (existingEmail) {
            return res.status(400).json({ error: 'Staff member with the same Email already exists' });
        }

        // Update the staff member in the 'staff' table
        const [updated] = await Staff.update(
            { Emp_Fname, Emp_Lname, Joining_Date, Emp_type, Email, Address, Dept_ID, DOB, Qualifications, Specialization },
            { where: { Emp_ID: req.params.id } }
        );

        if (updated === 0) {
            return res.status(404).json({ error: 'Staff not found or not updated' });
        }

        // Handle Doctor type updates
        if (Emp_type === 'Doctor') {
            if (Qualifications || Specialization) {
                await Doctor.update(
                    { Qualifications, Specialization },
                    { where: { Emp_ID: req.params.id } }
                );
            }
        }

        res.json({ success: true, message: 'Staff updated successfully' });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const DeleteStaff = async (req, res) => {
    try {
        // Fetch the staff member using the Emp_ID and correct 'Email' field
        const staffMember = await Staff.findOne({ where: { Emp_ID: req.params.id } });

        if (!staffMember) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        const staffEmail = staffMember.Email; // Correct column name to 'Email'

        // Delete the staff member
        const deletedStaff = await Staff.destroy({ where: { Emp_ID: req.params.id } });

        if (deletedStaff === 0) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        // Delete the associated user by email
        const deletedUser = await User.destroy({ where: { email: staffEmail } });

        if (deletedUser === 0) {
            return res.status(404).json({ error: 'User associated with staff not found' });
        }

        res.json({ success: true, message: 'Staff and associated user deleted successfully' });
    } catch (error) {
        console.error('Error deleting staff and user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const CheckStaffExistence = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await Staff.findByPk(id);
        if (!staff) {
            res.status(404).json({ error: 'Staff not found' });
            return;
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error checking staff existence:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getDoctorByEmail = async (email) => {
    try {
        const doctor = await Doctor.findOne({
            include: [{ model: Staff, where: { Email: email, Emp_type: 'doctor' } }]
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

const getDoctorData = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userRole = req.user.role;

        let visits;
        if (userRole === 'admin') {
            visits = await Visit.findAll({
                include: [
                    { model: Patient, attributes: ['Patient_Fname', 'Patient_Lname'] },
                    { 
                        model: Doctor, 
                        attributes: ['Doctor_ID'],
                        include: [{ model: Staff, attributes: ['Emp_Fname', 'Emp_Lname', 'Email'] }] // Ensure Email is included
                    }
                ]
            });

            const visitsDataWithNames = visits.map(visit => ({
                ...visit.toJSON(),
                Patient_Name: visit.Patient ? `${visit.Patient.Patient_Fname} ${visit.Patient.Patient_Lname}` : 'Unknown Patient',
                Doctor_Name: visit.Doctor && visit.Doctor.Staff ? `${visit.Doctor.Staff.Emp_Fname} ${visit.Doctor.Staff.Emp_Lname}` : 'Unknown Doctor',
                Doctor_Email: visit.Doctor && visit.Doctor.Staff ? visit.Doctor.Staff.Email : 'Unknown Doctor' // Fix here
            }));

            return res.json({ visits: visitsDataWithNames });
        } else {
            const doctor = await getDoctorByEmail(userEmail);

            visits = await Visit.findAll({
                where: { Doctor_ID: doctor.Doctor_ID },
                include: [{ model: Patient }]
            });

            const visitsDataWithNames = visits.map(visit => ({
                ...visit.toJSON(),
                Patient_Name: visit.Patient ? `${visit.Patient.Patient_Fname} ${visit.Patient.Patient_Lname}` : 'Unknown Patient',
                Doctor_Name: `${doctor.Staff.Emp_Fname} ${doctor.Staff.Emp_Lname}`,
                Doctor_Email: doctor.Staff.Email // Fix here
            }));

            return res.json({ visits: visitsDataWithNames });
        }
    } catch (error) {
        console.error('Error fetching doctor data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    FindAllStaff,
    FindSingleStaff,
    AddStaff,
    UpdateStaff,
    DeleteStaff,
    CheckStaffExistence,
    FindNurses,
    FindDoctors,
    getDoctorData
};
