import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Modal, MenuItem } from '@mui/material';

function UpdatePayroll({ id, onClose }) {
    const [formData, setFormData] = useState({
        Emp_ID: '',
        Salary: ''
    });
    const [originalData, setOriginalData] = useState({});
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [existingRatings, setExistingRatings] = useState([]);
    const navigate = useNavigate();
    const token = Cookies.get('token');
    const [staff, setStaff] = useState([]);

    useEffect(() => {
        fetchStaff();
        fetchData();
        fetchExistingRatings();
    }, [id]);

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

    const fetchData = async () => {
        try {
            const response = await axios.get(`http://localhost:9004/api/payroll/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data;
            setOriginalData(data);
            setFormData({
                Emp_ID: data.Emp_ID,
                Salary: Math.round(data.Salary) || '' // Convert Salary to an integer
            });
        } catch (error) {
            console.error('Error fetching payroll data:', error);
            showAlert('Error fetching payroll details.');
        }
    };
    

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    const fetchExistingRatings = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/payroll', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setExistingRatings(response.data);
        } catch (error) {
            console.error('Error fetching existing ratings:', error);
        }
    };

    const handleUpdatePayroll = async () => {
        const salaryOriginal = Math.round(originalData.Salary);
        const salaryNew = Math.round(formData.Salary);
    
        // Check if the Emp_ID or Salary has changed
        if (
            formData.Emp_ID === originalData.Emp_ID &&
            salaryNew === salaryOriginal
        ) {
            showAlert("Data must be changed before updating.");
            return;
        }
    
        // Salary validation
        if (!formData.Salary || formData.Salary <= 0) {
            showAlert("Salary must be greater than 0.");
            return;
        }
    
        // Check for existing ratings
        const existingRating = existingRatings.find(payroll => payroll.Emp_ID === formData.Emp_ID);
        if (existingRating && existingRating.Account_no !== id) {
            showAlert('Employee has already a payroll');
            return;
        }
    
        try {
            await axios.put(`http://localhost:9004/api/payroll/update/${id}`, {
                Emp_ID: formData.Emp_ID,
                Salary: formData.Salary
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            navigate('/dashboard/payroll');
            window.location.reload();
        } catch (error) {
            console.error('Error updating payroll:', error);
            showAlert('Error updating payroll. Please try again.');
        }
    };
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
                <Typography variant="h6" component="h1" gutterBottom>Update Payroll</Typography>

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
                    helperText="Select the employee for whom you are updating the payroll."
                    disabled
                >
                    <MenuItem value=''>Select</MenuItem>
                    {staff.map((staffMember) => (
                        <MenuItem key={staffMember.Emp_ID} value={staffMember.Emp_ID}>
                            {`${staffMember.Emp_Fname} ${staffMember.Emp_Lname}`}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
    margin="dense"
    fullWidth
    select
    label="Salary"
    variant="outlined"
    id="Salary"
    name="Salary"
    value={formData.Salary}
    onChange={handleChange}
    helperText="Select the salary amount."
>
    <MenuItem value={1000.00}>1000.00</MenuItem>
    <MenuItem value={1500.00}>1500.00</MenuItem>
    <MenuItem value={2000.00}>2000.00</MenuItem>
</TextField>


                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleUpdatePayroll} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default UpdatePayroll;
