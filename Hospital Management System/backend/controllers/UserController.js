const bcrypt = require('bcrypt');
const User = require('../models/User');
const UserRole = require('../models/UserRole');
const Role = require('../models/Role');
const { Op } = require('sequelize');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff'); // Make sure to import the Staff model
const FindUsersWithoutEmailInPatientOrStaff = async (req, res) => {
    try {
        // Fetch all users with their associated roles
        const users = await User.findAll({
            include: {
                model: UserRole,
                include: {
                    model: Role,
                    attributes: ['role_name'], // Fetch the role name
                },
            },
        });

        // Fetch all emails from Patient and Staff models
        const [patientEmails, staffEmails] = await Promise.all([
            Patient.findAll({ attributes: ['Email'] }), // 'Email' from Patient model
            Staff.findAll({ attributes: ['Email'] })    // 'Email' from Staff model
        ]);

        // Extract emails into arrays
        const existingPatientEmails = patientEmails.map(patient => patient.Email);
        const existingStaffEmails = staffEmails.map(staff => staff.Email);

        // Combine the two email arrays and remove duplicates
        const allExistingEmails = [...new Set([...existingPatientEmails, ...existingStaffEmails])];

        // Filter users whose emails do not exist in the combined email list
        const filteredUsers = users.filter(user => {
            // Check if the user has roles and if any of them is admin
            const isAdmin = user.UserRoles && user.UserRoles.some(userRole => userRole.Role.role_name === 'admin');
            if (isAdmin) return false; // Skip admin users

            // Check if the user's email is not in the existing email list
            const emailExists = allExistingEmails.includes(user.Email || user.email);

            // Return true if the email does not exist
            return !emailExists;
        });

        // Extract desired properties from filtered users
        const userData = filteredUsers.map(user => ({
            id: user.user_id,              // Adjust to match your user model's property names
            username: user.username,        // Add the desired fields here
            email: user.Email || user.email  // Include email as well
            // Add any additional fields as needed
        }));

        // Send the response with the user data
        res.json(userData);
    } catch (error) {
        console.error('Error fetching users without existing emails in Patient or Staff:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const FindUsersWithPeriodInEmail = async (req, res) => {
    try {
        // Fetch all users with their associated roles
        const users = await User.findAll({
            include: {
                model: UserRole,
                include: {
                    model: Role,
                    attributes: ['role_name'], // Fetch the role name
                },
            },
            attributes: ['user_id', 'username', 'email'], // Fetch user_id, username, and email
        });

        // Filter users that have the 'patient' role and a period (".") before the "@" in their email
        const usersWithPeriodBeforeAt = users.filter(user => {
            const roleNames = user.UserRoles.map(userRole => userRole.Role.role_name);
            const email = user.email;
            const atIndex = email.indexOf('@');
            
            // Check if the user has the 'patient' role and if the email contains a period before the "@" symbol
            return roleNames.includes('patient') && atIndex !== -1 && email.lastIndexOf('.', atIndex) !== -1;
        });

        // Extract desired properties from filtered users
        const userData = usersWithPeriodBeforeAt.map(user => ({
            id: user.user_id,              // Adjust to match your user model's property names
            username: user.username,        // Add the desired fields here
            email: user.email               // Include email as well
            // Add any additional fields as needed
        }));

        // Send response with all patients that have a '.' before the '@'
        res.json(userData);

    } catch (error) {
        console.error('Error fetching users with period in email:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
const saltRounds = 10;

const FindAllUsers = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userRole = req.user.role;

        let users;
        if (userRole === 'admin') {
            // Admin can fetch all users
            users = await User.findAll();
        } else if (userRole === 'patient') {
            // Fetch the patient by email
            const patient = await getPatientByEmail(userEmail);
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            // Patients can fetch only their own information
            users = await User.findAll({
                where: { email: userEmail },
            });
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Format the response to include additional data
        const usersDataWithNames = users.map(user => ({
            ...user.toJSON(),
            FullName: `${user.firstName} ${user.lastName}` || 'Unknown User'
        }));

        res.json(usersDataWithNames);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const getUsersWithRoles = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [{
                model: UserRole,
                include: [{
                    model: Role,
                    attributes: ['role_name']
                }]
            }],
            attributes: ['user_id', 'username', 'email']
        });

        // Map users to include roles
        const usersWithRoles = users.map(user => ({
            ...user.toJSON(),
            role: user.UserRoles.length > 0 ? user.UserRoles[0].Role.role_name : 'No Role'
        }));


        res.json(usersWithRoles);
    } catch (error) {
        console.error('Error fetching users with roles:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const FindSingleUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [
                {
                    model: UserRole,
                    include: [
                        {
                            model: Role,
                            attributes: ['role_name']  // Include role_name in the response
                        }
                    ]
                }
            ],
            attributes: ['user_id', 'username', 'email']  // Select relevant user attributes
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Map the role from the UserRole relation
        const userWithRole = {
            ...user.toJSON(),
            role: user.UserRoles.length > 0 ? user.UserRoles[0].Role.role_name : 'No Role'
        };

        res.json(userWithRole);
    } catch (error) {
        console.error('Error fetching single user with role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const AddUser = async (req, res) => {
    try {
        const { email, username, password, role } = req.body;

        // Validate input fields
        if (!email || !username || !password || !role) {
            console.error('Validation error: All fields are required');
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error('Validation error: Invalid email address');
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Validate username length
        if (username.length < 3) {
            console.error('Validation error: Username must be at least 3 characters long');
            return res.status(400).json({ error: 'Username must be at least 3 characters long' });
        }

        // Validate password length
        if (password.length < 6) {
            console.error('Validation error: Password must be at least 6 characters long');
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            console.error('Validation error: User with the same username already exists');
            return res.status(400).json({ error: 'User with the same username already exists' });
        }
                // Check if the user already exists
        const existingUser1 = await User.findOne({ where: { email } });
        if (existingUser1) {
            console.error('Validation error: User with the same email already exists');
            return res.status(400).json({ error: 'User with the same email already exists' });
        }

        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await User.create({
            email,
            username,
            password: hashedPassword,
        });

        // Find the role by name
        const userRole = await Role.findOne({ where: { role_name: role } });
        if (!userRole) {
            console.error('Validation error: Invalid role');
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Assign the role to the user
        await UserRole.create({
            user_id: newUser.user_id,
            role_id: userRole.role_id,
        });

        res.json({ success: true, message: 'User added successfully', data: newUser });
    } catch (error) {
        console.error('Error adding user:', error.message, error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const UpdateUser = async (req, res) => {
    try {
        const { email, username, password, role } = req.body;

        // Validate input fields
        if (!email || !username || !role) {
            return res.status(400).json({ error: 'Email, username, and role are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Validate username length
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters long' });
        }

        // Check if the user exists
        const existingUser = await User.findOne({ where: { user_id: req.params.id } });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the email is already taken by another user
        const existingEmail = await User.findOne({ where: { email, user_id: { [Op.ne]: req.params.id } } });
        if (existingEmail) {
            return res.status(400).json({ error: 'User with the same email already exists' });
        }

        // Check if the username is already taken by another user
        const existingUsername = await User.findOne({ where: { username, user_id: { [Op.ne]: req.params.id } } });
        if (existingUsername) {
            return res.status(400).json({ error: 'User with the same username already exists' });
        }

        // Update user details
        const updatedUser = await User.update(
            { email, username },
            { where: { user_id: req.params.id } }
        );

        // Find the role by name
        const userRole = await Role.findOne({ where: { role_name: role } });
        if (!userRole) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Update user's role
        await UserRole.update(
            { role_id: userRole.role_id },
            { where: { user_id: req.params.id } }
        );

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const DeleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if the user exists
        const existingUser = await User.findOne({ where: { user_id: userId } });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userEmail = existingUser.email; // Get the email of the user to be deleted

        // Delete related staff and patients by the same email
        await Staff.destroy({ where: { email: userEmail } });
        await Patient.destroy({ where: { email: userEmail } });

        // Delete the user
        await User.destroy({ where: { user_id: userId } });

        res.json({ success: true, message: 'User and associated staff/patients deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    DeleteUser,
    // other exports...
};

module.exports = {
    FindAllUsers,
    FindSingleUser,
    AddUser,
    UpdateUser,
    DeleteUser,
    getUsersWithRoles,
    FindUsersWithoutEmailInPatientOrStaff,
    FindUsersWithPeriodInEmail
};
