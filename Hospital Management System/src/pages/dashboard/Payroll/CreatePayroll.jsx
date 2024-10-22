import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Box, TextField, Button, Typography, MenuItem } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';

function CreatePayroll({ onClose }) {
    const [formData, setFormData] = useState({
        Emp_ID: '',
        Salary: '',
    });
    const [staff, setStaff] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const token = Cookies.get('token');

    useEffect(() => {
        fetchStaff();

        // Get staff ID from location state
        const staffid = location.state?.staffid;
        if (staffid) {
            setFormData((prevState) => ({ ...prevState, Emp_ID: staffid })); // Set staff ID
        }
    }, [location.state]);

    const fetchStaff = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/staff', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
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

    const handleAddPayroll = async () => {
        try {
            await axios.post('http://localhost:9004/api/payroll/create', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            navigate('/dashboard/payroll');
            window.location.reload();
        } catch (error) {
            // Check for the specific error from the backend
            if (error.response && error.response.status === 400) {
                // Show the specific error message from the backend
                showAlert(error.response.data.error);
            } else {
                // Handle general errors
                console.error('Error adding payroll:', error);
                showAlert('Error adding payroll. Please try again.');
            }
        }
    };
    

    const handleValidation = async () => {
        const { Emp_ID, Salary } = formData;

        if (Emp_ID === '' || Salary === '') {
            showAlert('All fields are required');
            return;
        }
        if (Salary <= 0) {
            showAlert('Salary must be greater than 0');
            return;
        }

        try {
            await axios.get(`http://localhost:9004/api/staff/check/${Emp_ID}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            handleAddPayroll();
        } catch (error) {
            console.error('Error checking employee ID:', error);
            showAlert('Employee ID does not exist');
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
                <Typography variant="h6" component="h1" gutterBottom>Add Payroll</Typography>

                <TextField
                    margin="dense"
                    fullWidth
                    select
                    label="Employee"
                    variant="outlined"
                    id="Emp_ID"
                    name="Emp_ID"
                    value={formData.Emp_ID}
                    onChange={handleChange}
                    helperText="Select the staff member for payroll"
                >
                    <MenuItem value=''>Select</MenuItem>
                    {staff.map((staff) => (
                        <MenuItem key={staff.Emp_ID} value={staff.Emp_ID}>
                            {`${staff.Emp_Fname} ${staff.Emp_Lname}`}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    select // Change this to enable dropdown functionality
                    label='Salary'
                    variant='outlined'
                    margin='dense'
                    name='Salary'
                    value={formData.Salary}
                    onChange={handleChange}
                    helperText="Select the salary amount" // Updated helper text
                >
                    <MenuItem value=''>Select Salary</MenuItem> {/* Placeholder option */}
                    <MenuItem value={1000}>1000</MenuItem>
                    <MenuItem value={1500}>1500</MenuItem>
                    <MenuItem value={2000}>2000</MenuItem>
                </TextField>


                <div className="flex justify-end">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleValidation}
                        sx={{ mr: 1 }}
                    >
                        Submit
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </div>
            </Box>
        </Modal>
    );
}

export default CreatePayroll;
