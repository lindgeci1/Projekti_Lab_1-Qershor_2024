import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Box, TextField, Button, Typography, FormControl ,FormHelperText , InputLabel , MenuItem ,Select, InputAdornment } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';

function CreateDepartment({ onClose }) {
    const [formData, setFormData] = useState({
        Dept_head: '',
        Dept_name: '',
        Emp_Count: '',
    });

    const [departments, setDepartments] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleAddDepartment = async () => {
        try {
            await axios.post('http://localhost:9004/api/department/create', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            navigate('/dashboard/department');
            window.location.reload();
        } catch (error) {
            console.error('Error adding Department:', error);
            if (error.response && error.response.data.error) {
                setAlertMessage(error.response.data.error); // Use the message from the backend
            } else {
                setAlertMessage('Error adding Department. Please try again.');   
            }
            setShowErrorModal(true);
        }
    };

    const handleValidation = () => {
        const { Dept_head, Dept_name, Emp_Count } = formData;

        if (!Dept_head.trim() || !Dept_name.trim() || Emp_Count === '') {
            showAlert('All fields are required');
            return;
        }
        if (Dept_head.length < 2) {
            showAlert('Head name must be at least 2 characters long');
            return;
        }
        if (Dept_name.length < 2) {
            showAlert('Department name must be at least 2 characters long');
            return;
        }
        if (Emp_Count < 7) {
            showAlert('Employee count cannot be less than 7');
            return;
        }
        if (Emp_Count > 12) {
            showAlert('Employee count cannot be more than 12');
            return;
        }
        // Check if comments contain any numbers
        if (/\d/.test(Dept_head)) {
            showAlert('Department Head cannot contain numbers');
            return;
        }
        // Check if comments contain any numbers
        if (/\d/.test(Dept_name)) {
            showAlert('Department Name cannot contain numbers');
            return;
        }

        // Proceed with form submission after successful validation
        handleAddDepartment();
    };

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
                <Typography variant="h6" component="h1" gutterBottom>Add Department</Typography>
                
             
                    <TextField                    
                        fullWidth
                        label="Department Head"
                        variant="outlined"
                        id="dept_head"
                        name="Dept_head"
                        type="text"
                        value={formData.Dept_head}
                        onChange={handleChange}
                        helperText="Enter the name of the department head (at least 2 characters)."
                    />

                
                
    <FormControl fullWidth variant="outlined" margin="dense">
        <InputLabel id="department-select-label">Department</InputLabel>
        <Select
            labelId="department-select-label"
            name="Dept_name"
            value={formData.Dept_name}
            onChange={handleChange}
            label="Department"
        >
            <MenuItem value=""><em>Select Department</em></MenuItem>
            <MenuItem value="Dermatology">Dermatology</MenuItem>
            <MenuItem value="Neurology">Neurology</MenuItem>
            <MenuItem value="Pediatrics">Pediatrics</MenuItem>
        </Select>
        <FormHelperText>Select the department name.</FormHelperText>
    </FormControl>


                
                <Box mb={2}>
                    <TextField
                        fullWidth
                        label="Employee Count" 
                        variant="outlined"                          
                        id='emp_Count'
                        name='Emp_Count'
                        type="number"
                        value={formData.Emp_Count}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">Employees:</InputAdornment>,
                        }}
                        helperText="Enter the number of employees (must be at least 1)."
                    />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleValidation} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default CreateDepartment;
