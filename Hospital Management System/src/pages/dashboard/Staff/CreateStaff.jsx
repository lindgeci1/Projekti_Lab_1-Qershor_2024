import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Select, FormHelperText, MenuItem, InputLabel, FormControl, Modal } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';

function CreateStaff({ onClose }) {
    const [formData, setFormData] = useState({
        Emp_Fname: '',
        Emp_Lname: '',
        Joining_Date: new Date().toISOString().split('T')[0],
        Emp_type: 'Doctor',
        Email: '',
        Address: '',
        Dept_ID: '',
        DOB: '',
        Qualifications: '',
        Specialization: ''
    });
    const [staff, setStaff] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [department, setDepartments] = useState([]);
    const navigate = useNavigate();
    const token = Cookies.get('token');

    useEffect(() => {
        fetchDepartments();
    }, []);

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

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/staff', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setStaff(response.data);
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

    const handleAddStaff = async () => {
        try {
            await axios.post("http://localhost:9004/api/staff/create", formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            navigate('/dashboard/staffs');
            window.location.reload();
        } catch (error) {
            console.error('Error adding Staff:', error);
            showAlert(error.response.data.error);
        }
    };

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    const handleValidation = async () => {
        const {
            Emp_Fname,
            Emp_Lname,
            Emp_type,
            Email,
            Address,
            Dept_ID,
            DOB,
            Qualifications,
            Specialization
        } = formData;

        if (!Emp_Fname || !Emp_Lname || !Emp_type || !Email || !Address || !Dept_ID || !DOB || !Qualifications || !Specialization) {
            showAlert('All fields are required!');
            return;
        }

        const validateEmail = (email) => {
            const re = /^[^\s@]+@[^\s@]+\.(com|ubt-uni\.net)$/;
            return re.test(String(email).toLowerCase());
        };

        if (!validateEmail(Email)) {
            showAlert('Email must end with @ubt-uni.net or .com');
            return;
        }

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

        const existingStaff = staff.find(staff => 
            staff.Emp_Fname === formData.Emp_Fname && 
            staff.Emp_Lname === formData.Emp_Lname && 
            staff.Email === formData.Email
        );

        if (existingStaff) {
            showAlert('Staff member with the same first name, last name, and email already exists.');
            return;
        }

        const existingStaffByEmail = staff.find(staff => staff.Email === Email);
        if (existingStaffByEmail) {
            showAlert('Staff member with the same Email already exists.');
            return;
        }

        handleAddStaff();
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
                <Typography variant="h6" component="h1" gutterBottom>Add Staff</Typography>
                
                <TextField
                    fullWidth
                    margin="dense"
                    label="First Name"
                    variant="outlined"
                    id="Emp_Fname"
                    name="Emp_Fname"
                    placeholder="Enter First Name"
                    value={formData.Emp_Fname}
                    onChange={handleChange}
                    helperText="Only letters are allowed."
                />
                
                <TextField
                    fullWidth
                    margin="dense"
                    label="Last Name"
                    variant="outlined"
                    id="Emp_Lname"
                    name="Emp_Lname"
                    placeholder="Enter Last Name"
                    value={formData.Emp_Lname}
                    onChange={handleChange}
                    helperText="Only letters are allowed."
                />
                
                <input
                    type="hidden"
                    id="Joining_Date"
                    name="Joining_Date"
                    value={formData.Joining_Date}
                />
                
                <TextField
                    fullWidth
                    margin="dense"
                    label="Email"
                    variant="outlined"
                    id="Email"
                    name="Email"
                    placeholder="Enter Email"
                    value={formData.Email}
                    onChange={handleChange}
                    helperText="Must end with @ubt-uni.net or .com."
                />
                
                <TextField
                    fullWidth
                    margin="dense"
                    label="Address"
                    variant="outlined"
                    id="Address"
                    name="Address" 
                    placeholder="Enter Address"
                    value={formData.Address}
                    onChange={handleChange}
                    helperText="Only letters are allowed."
                />
                
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
                                {`${departmenttype.Dept_name}`}
                            </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>Please select a department.</FormHelperText>
                </FormControl>
                
                <TextField
                    fullWidth
                    margin="dense"
                    label="Date of Birth"
                    variant="outlined"
                    type="date"
                    id="DOB"
                    name="DOB"
                    value={formData.DOB}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    helperText="Select your date of birth."
                />
                
                <FormControl fullWidth margin="dense">
                    <InputLabel id="qualifications-label">Qualifications</InputLabel>
                    <Select
                        labelId="qualifications-label"
                        id="Qualifications"
                        name="Qualifications"
                        value={formData.Qualifications}
                        onChange={handleChange}
                        label="Qualifications"
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
                        labelId="specialization-label"
                        id="Specialization"
                        name="Specialization"
                        value={formData.Specialization}
                        onChange={handleChange}
                        label="Specialization"
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

export default CreateStaff;
