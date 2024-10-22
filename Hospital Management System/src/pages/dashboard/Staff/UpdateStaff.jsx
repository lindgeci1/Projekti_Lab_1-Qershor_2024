    import React, { useState, useEffect } from 'react';
    import axios from 'axios';
    import { Modal, Box, TextField, FormHelperText, Button, Typography, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
    import ErrorModal from '../../../components/ErrorModal';
    import Cookies from 'js-cookie';
    import { jwtDecode } from 'jwt-decode';
    function UpdateStaff({ id, onClose }) {
        const [formData, setFormData] = useState({
            Emp_Fname: '',
            Emp_Lname: '',
            Joining_Date: '',
            Emp_type: '',
            Email: '',
            Address: '',
            Dept_ID: '',
            DOB: '',
            Qualifications: '',
            Specialization: ''
        });
        const [department, setDepartments] = useState([]);
        const [originalData, setOriginalData] = useState({});
        const [staff, setStaff] = useState([]); // New state for staff data
        const [alertMessage, setAlertMessage] = useState('');
        const [showErrorModal, setShowErrorModal] = useState(false);
        const token = Cookies.get('token');
        const [userRole, setUserRole] = useState('');
        useEffect(() => {
            const fetchUserRole = async () => {
                try {
                    const decodedToken = jwtDecode(token);
                    const userEmail = decodedToken.email;
                    
                    const userResponse = await axios.get('http://localhost:9004/api/users', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const currentUser = userResponse.data.find(user => user.email === userEmail);
                    const role = currentUser.role;
                    console.log(currentUser);
                    console.log('User Role:', role); // Debug log to verify the user role
                    setUserRole(role);
                } catch (err) {
                    console.error('Error fetching user role:', err.response ? err.response.data : err.message);
                }
            };
    
            fetchUserRole();
        }, [token]);
        useEffect(() => {
            fetchStaffDetails();
            fetchDepartments();
            fetchAllStaff(); // Fetch all staff data
        }, [id]);

        const fetchStaffDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:9004/api/staff/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = response.data;
                setOriginalData(data); // Save original data
                setFormData(data);
            } catch (error) {
                console.error('Error fetching staff details:', error);
                showAlert('Error fetching staff details.');
            }
        };

        const fetchDepartments = async () => {
            try {
                const response = await axios.get('http://localhost:9004/api/department', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setDepartments(response.data);
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
        };

        // Fetch all staff members
        const fetchAllStaff = async () => {
            try {
                const response = await axios.get('http://localhost:9004/api/staff', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setStaff(response.data); // Set the staff data
            } catch (error) {
                console.error('Error fetching staff:', error);
            }
        };

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        };

        const handleValidation = async () => {
            const { 
                Emp_Fname, 
                Emp_Lname, 
                Joining_Date, 
                Emp_type, 
                Email, 
                Address, 
                Dept_ID, 
                DOB, 
                Qualifications, 
                Specialization 
            } = formData;
        
            // Step 1: Validate all required fields
            if (!Emp_Fname || !Emp_Lname || !Emp_type || !Email || !Address || !Dept_ID || !DOB || !Qualifications || !Specialization) {
                showAlert('All fields are required!');
                return;
            }
        
            // Step 2: Validate email format
            const validateEmail = (email) => {
                const re = /^[^\s@]+@[^\s@]+\.(com|ubt-uni\.net)$/;
                return re.test(String(email).toLowerCase());
            };
        
            if (!validateEmail(Email)) {
                showAlert('Email must end with @ubt-uni.net or .com');
                return;
            }
        
            // Step 3: Validate name and surname to contain only letters
            const validateName = (name) => /^[A-Za-z]+$/.test(name);
            
            if (!validateName(Emp_Fname)) {
                showAlert('First Name can only contain letters');
                return;
            }
            
            if (!validateName(Emp_Lname)) {
                showAlert('Last Name can only contain letters');
                return;
            }
            if (!validateName(Address)) {
                showAlert('Address can only contain letters');
                return;
            }
        
            // Step 3: Check if any data has been changed
            if (
                formData.Emp_Fname === originalData.Emp_Fname &&
                formData.Emp_Lname === originalData.Emp_Lname &&
                formData.Email === originalData.Email &&
                formData.Address === originalData.Address &&
                formData.DOB === originalData.DOB &&
                formData.Qualifications === originalData.Qualifications &&
                formData.Specialization === originalData.Specialization
            ) {
                showAlert('Data must be changed before updating.');
                return;
            }
        
            // Step 4: Check for existing staff with the same first name, last name, and email
            const existingStaff = staff.find(staff =>
                staff.Emp_Fname === formData.Emp_Fname && 
                staff.Emp_Lname === formData.Emp_Lname && 
                staff.Email === formData.Email &&
                staff.Emp_ID !== id // Exclude the current staff member
            );
        
            if (existingStaff) {
                showAlert('Staff member with the same first name, last name, and email already exists.');
                return;
            }
        
            // Step 5: Check for existing staff with the same email
            const existingStaffByEmail = staff.find(staff => 
                staff.Email === formData.Email && 
                staff.Emp_ID !== id // Exclude the current staff member
            );
        
            if (existingStaffByEmail) {
                showAlert('Staff member with the same Email already exists.');
                return;
            }
        
            // Step 6: Proceed with the update request if validation passes
            try {
                await axios.put(`http://localhost:9004/api/staff/update/${id}`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
        
                // Success: Close the modal and reload the page
                onClose(); // Close the modal after updating
                window.location.reload(); // Reload the page
            } catch (error) {
                console.error('Error updating staff:', error);
                showAlert('Error updating staff.');
            }
        };
        
        const showAlert = (message) => {
            setAlertMessage(message);
            setShowErrorModal(true);
        };

        return (
            <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
                <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                    {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
                    <Typography variant="h6" component="h1" gutterBottom>Update Staff</Typography>

                    <TextField
                        margin="dense"
                        fullWidth
                        label="First Name"
                        variant="outlined"
                        id="Emp_Fname"
                        name="Emp_Fname"
                        value={formData.Emp_Fname}
                        onChange={handleChange}
                         helperText="Only letters are allowed."
                    />
                    <TextField
                        margin="dense"
                        fullWidth
                        label="Last Name"
                        variant="outlined"
                        id="Emp_Lname"
                        name="Emp_Lname"
                        value={formData.Emp_Lname}
                        onChange={handleChange}
                         helperText="Only letters are allowed."
                    />
                    {/* <TextField
                        margin="dense"
                        fullWidth
                        label="Joining Date"
                        variant="outlined"
                        type="date"
                        id="Joining_Date"
                        name="Joining_Date"
                        value={formData.Joining_Date}
                        onChange={handleChange}
                        disabled
                    /> */}
                    <TextField
                        margin="dense"
                        fullWidth
                        label="Email"
                        variant="outlined"
                        id="Email"
                        name="Email"
                        value={formData.Email}
                        onChange={handleChange}
                         helperText="Must end with @ubt-uni.net or .com."
                    />
                    <TextField
                        margin="dense"
                        fullWidth
                        label="Address"
                        variant="outlined"
                        id="Address"
                        name="Address"
                        value={formData.Address}
                        onChange={handleChange}
                        helperText="Only letters are allowed."
                    />
{userRole === 'admin' && (
    <FormControl fullWidth variant="outlined" margin="dense">
        <InputLabel id="department-select-label">Department</InputLabel>
        <Select
            labelId="department-select-label"
            id="visitDepartmentID"
            name="Dept_ID"
            value={formData.Dept_ID}
            onChange={handleChange}
            label="Department"
        >
            <MenuItem value=""><em>Select Department</em></MenuItem>
            {department.map(departmenttype => (
                <MenuItem key={departmenttype.Dept_ID} value={departmenttype.Dept_ID}>
                    {departmenttype.Dept_name}
                </MenuItem>
            ))}
        </Select>
        <FormHelperText>Please select a department.</FormHelperText>
    </FormControl>
)}

                    <TextField
                        margin="dense"
                        fullWidth
                        label="Date of Birth"
                        variant="outlined"
                        type="date"
                        id="DOB"
                        name="DOB"
                        value={formData.DOB}
                        onChange={handleChange}
                    />


<FormControl fullWidth margin="dense">
  <InputLabel id="qualifications-label">Qualifications</InputLabel>
  <Select
fullWidth
margin="dense"
label="Qualifications"
variant="outlined"
type="text"
id="Qualifications"
name="Qualifications"
value={formData.Qualifications}
onChange={handleChange}
disabled
  >
    <MenuItem value=""><em>Select Qualifications</em></MenuItem>
    <MenuItem value="Bachelor's Degree">Bachelor's Degree</MenuItem>
    <MenuItem value="Master's Degree">Master's Degree</MenuItem>
    <MenuItem value="PhD">PhD</MenuItem>
    <MenuItem value="Diploma">Diploma</MenuItem>
  </Select>
  <FormHelperText>Select your qualifications.</FormHelperText>
  
</FormControl>
                    <FormControl fullWidth margin="dense">
    <InputLabel id="specialization-label">Specialization</InputLabel>
    <Select
        fullWidth
        margin="dense"
        label="Specialization"
        variant="outlined"
        type="text"
        id="Specialization"
        name="Specialization"
        value={formData.Specialization}
        onChange={handleChange}
        disabled
    >
        <MenuItem value=""><em>Select Specialization</em></MenuItem>
        <MenuItem value="Cardiology">Emergency medicine</MenuItem>
        <MenuItem value="Dermatology">Diagnostic radiology</MenuItem>
        <MenuItem value="Neurology">Medical genetics</MenuItem>
        <MenuItem value="Pediatrics">Internal medicine</MenuItem>
    </Select>
    <FormHelperText>Select your specialization.</FormHelperText>
    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="contained" color="primary" onClick={handleValidation} sx={{ mr: 1 }}>Submit</Button>
                        <Button variant="outlined" onClick={onClose}>Cancel</Button>
                    </Box>
                </Box>
            </Modal>
        );
    }

    export default UpdateStaff;
