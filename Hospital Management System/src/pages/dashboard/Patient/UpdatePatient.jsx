import axios from 'axios';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, FormHelperText, Select, MenuItem, InputLabel, FormControl, Modal } from '@mui/material';
import Cookies from 'js-cookie';

// Lazy load the ErrorModal component
const ErrorModal = lazy(() => import('../../../components/ErrorModal'));

function UpdatePatient({ id, onClose }) {
    const [formData, setFormData] = useState({
        Personal_Number: '',
        Patient_Fname: '',
        Patient_Lname: '',
        Birth_Date: '',
        Blood_type: '',
        Email: '',
        Gender: '',
        Phone: ''
    });
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [patients, setPatients] = useState([]);
    const navigate = useNavigate();
    const token = Cookies.get('token');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:9004/api/patient/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = response.data;
                setOriginalData(data);
                setFormData({
                    Personal_Number: data.Personal_Number,
                    Patient_Fname: data.Patient_Fname,
                    Patient_Lname: data.Patient_Lname,
                    Birth_Date: data.Birth_Date,
                    Blood_type: data.Blood_type,
                    Email: data.Email,
                    Gender: data.Gender,
                    Phone: data.Phone
                });
            } catch (error) {
                console.error('Error fetching patient:', error);
            }
        };

        fetchData();
    }, [id, token]);

    useEffect(() => {
        const fetchAllPatients = async () => {
            try {
                const response = await axios.get('http://localhost:9004/api/patient', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setPatients(response.data);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        fetchAllPatients();
    }, [token]);

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleUpdatePatient = async () => {
        try {
            const { Personal_Number, Patient_Fname, Patient_Lname, Birth_Date, Blood_type, Email, Gender, Phone } = formData;

            // Frontend validations
            if (!Patient_Fname.trim() || !Patient_Lname.trim() || !Blood_type.trim() || !Email.trim() || !Gender.trim() || !Phone.trim()) {
                showAlert('All fields are required.');
                return;
            }

            // Validate email
            const validateEmail = (email) => {
                const re = /^[^\s@]+@[^\s@]+\.(com|ubt-uni\.net)$/;
                return re.test(String(email).toLowerCase());
            };

            if (!validateEmail(Email)) {
                showAlert('Email must end with @ubt-uni.net or .com');
                return;
            }

            // Validate names
            const validateName = (name) => /^[A-Za-z]+$/.test(name);

            if (!validateName(Patient_Fname)) {
                showAlert('First Name can only contain letters');
                return;
            }

            if (!validateName(Patient_Lname)) {
                showAlert('Last Name can only contain letters');
                return;
            }

            // Ensure changes were made before submitting
            if (
                Personal_Number === originalData.Personal_Number &&
                Patient_Fname === originalData.Patient_Fname &&
                Patient_Lname === originalData.Patient_Lname &&
                Birth_Date === originalData.Birth_Date &&
                Blood_type === originalData.Blood_type &&
                Email === originalData.Email &&
                Gender === originalData.Gender &&
                Phone === originalData.Phone
            ) {
                showAlert('No changes detected.');
                return;
            }

            // Send updated data to backend
            const response = await axios.put(`http://localhost:9004/api/patient/update/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                navigate('/dashboard/patient');
                window.location.reload();
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                showAlert(error.response.data.error);
            } else {
                console.error('Error updating patient:', error);
                showAlert('An error occurred while updating the patient. Please try again later.');
            }
        }
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                <Suspense fallback={<div>Loading...</div>}>
                    {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
                </Suspense>
                <Typography variant="h6" component="h1" gutterBottom>Update Patient</Typography>
                <TextField
                    fullWidth
                    margin="dense"
                    label="Personal Number"
                    variant="outlined"
                    id="Personal_Number"
                    name="Personal_Number"
                    type="number"
                    placeholder="Enter Personal Number"
                    value={formData.Personal_Number}
                    onChange={handleChange}
                    helperText="Enter a unique personal number."
                    disabled
                />
                <TextField
                    fullWidth
                    margin="dense"
                    label="First Name"
                    variant="outlined"
                    id="Patient_Fname"
                    name="Patient_Fname"
                    placeholder="Enter Firstname"
                    value={formData.Patient_Fname}
                    onChange={handleChange}
                    helperText="Only letters are allowed."
                />
                <TextField
                    fullWidth
                    margin="dense"
                    label="Last Name"
                    variant="outlined"
                    id="Patient_Lname"
                    name="Patient_Lname"
                    placeholder="Enter Lastname"
                    value={formData.Patient_Lname}
                    onChange={handleChange}
                    helperText="Only letters are allowed."
                />
                <TextField
                    fullWidth
                    margin="dense"
                    label="Birth Date"
                    variant="outlined"
                    type="date"
                    id="Birth_Date"
                    name="Birth_Date"
                    value={formData.Birth_Date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    
                    helperText="Enter your birth date."
                />
                <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="gender-select-label">Gender</InputLabel>
                    <Select
                        labelId="gender-select-label"
                        id="Gender"
                        name="Gender"
                        value={formData.Gender}
                        onChange={handleChange}
                        label="Gender"
                        
                    >
                        <MenuItem value=""><em>Select Gender</em></MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                        <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                    </Select>
                    <FormHelperText>Please select your Gender.</FormHelperText>
                </FormControl>
                <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="blood-type-select-label">Blood Type</InputLabel>
                    <Select
                        labelId="blood-type-select-label"
                        id="Blood_type"
                        name="Blood_type"
                        value={formData.Blood_type}
                        onChange={handleChange}
                        label="Blood Type"
                        
                    >
                        <MenuItem value=""><em>Select Blood Type</em></MenuItem>
                        <MenuItem value="A+">A+</MenuItem>
                        <MenuItem value="A-">A-</MenuItem>
                        <MenuItem value="B+">B+</MenuItem>
                        <MenuItem value="B-">B-</MenuItem>
                        <MenuItem value="AB+">AB+</MenuItem>
                        <MenuItem value="AB-">AB-</MenuItem>
                        <MenuItem value="O+">O+</MenuItem>
                        <MenuItem value="O-">O-</MenuItem>
                    </Select>
                    <FormHelperText>Please select a Blood Type.</FormHelperText>
                </FormControl>
                <TextField
                    fullWidth
                    margin="dense"
                    label="Email"
                    variant="outlined"
                    id="Email"
                    name="Email"
                    placeholder="Enter email"
                    value={formData.Email}
                    onChange={handleChange}
                    helperText="Must end with @ubt-uni.net or .com."
                    disabled
                />
                <TextField
                    fullWidth
                    margin="dense"
                    label="Phone"
                    variant="outlined"
                    id="Phone"
                    name="Phone"
                    placeholder="Enter Phone"
                    value={formData.Phone}
                    onChange={handleChange}
                    helperText="Enter a valid phone number."
                    disabled
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleUpdatePatient} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default UpdatePatient;
