import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Typography, Select, MenuItem, InputLabel, FormHelperText, FormControl, Modal, TextField } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';

function CreateMedicalHistory({ onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Allergies: '',
        Pre_Conditions: '',
    });
    const [patients, setPatients] = useState([]);
    const [patientPhone, setPatientPhone] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const token = Cookies.get('token');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchPatients();
        
        // Get the patient ID from the URL location state
        const { patientId } = location.state || {};
        if (patientId) {
            setFormData((prev) => ({ ...prev, Patient_ID: patientId }));
            fetchPatientPhone(patientId);
        }
    }, [location.state]); // Re-run effect when location.state changes

    const fetchPatients = async () => {
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

    const fetchPatientPhone = async (patientId) => {
        try {
            const response = await axios.get(`http://localhost:9004/api/patient/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setPatientPhone(response.data.Phone);
        } catch (error) {
            console.error('Error fetching patient phone:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));

        if (name === 'Patient_ID') {
            fetchPatientPhone(value);
        }
    };

    const handleAddMedicalHistory = async () => {
        try {
            await axios.post('http://localhost:9004/api/medicalhistory/create', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            navigate('/dashboard/medicalhistorys');
            window.location.reload();
        } catch (error) {
            console.error('Error adding MedicalHistory:', error);
            const message = error.response?.data?.error || 'Error adding medical history. Please try again.';
            showAlert(message);
        }
    };

    const handleValidation = async () => {
        const { Patient_ID, Allergies, Pre_Conditions } = formData;

        if (Patient_ID === '' || Allergies === '' || Pre_Conditions === '') {
            showAlert('All fields are required');
            return;
        }

        if (parseInt(Patient_ID) < 1) {
            showAlert('Patient ID cannot be less than 1');
            return;
        }

        try {
            await axios.get(`http://localhost:9004/api/patient/check/${Patient_ID}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            handleAddMedicalHistory();
        } catch (error) {
            console.error('Error checking patient ID:', error);
            showAlert('Patient ID does not exist');
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
                <Typography variant="h6" component="h1" gutterBottom>Add Medical History</Typography>
                
                <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="patient-select-label">Patient</InputLabel>
                    <Select
                        labelId="patient-select-label"
                        name="Patient_ID"
                        value={formData.Patient_ID}
                        onChange={handleChange}
                        label="Patient"
                    >
                        <MenuItem value=""><em>Select Patient</em></MenuItem>
                        {patients.map(patient => (
                            <MenuItem key={patient.Patient_ID} value={patient.Patient_ID}>
                                {`${patient.Patient_Fname} ${patient.Patient_Lname}`}
                            </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>Select the patient for this medical history</FormHelperText>
                </FormControl>
                
                {/* Allergies Dropdown */}
                <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="allergies-select-label">Allergies</InputLabel>
                    <Select
                        labelId="allergies-select-label"
                        name="Allergies"
                        value={formData.Allergies}
                        onChange={handleChange}
                        label="Allergies"
                    >
                        <MenuItem value=""><em>Select Allergies</em></MenuItem>
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </Select>
                    <FormHelperText>Select if the patient has any allergies</FormHelperText>
                </FormControl>

                {/* Pre Conditions Dropdown */}
                <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="pre-conditions-select-label">Pre Conditions</InputLabel>
                    <Select
                        labelId="pre-conditions-select-label"
                        name="Pre_Conditions"
                        value={formData.Pre_Conditions}
                        onChange={handleChange}
                        label="Pre Conditions"
                    >
                        <MenuItem value=""><em>Select Pre Conditions</em></MenuItem>
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </Select>
                    <FormHelperText>Select if there are any pre-existing conditions</FormHelperText>
                </FormControl>

                {/* Patient Phone Field */}
                <TextField
                    fullWidth
                    label="Patient Phone"
                    variant="outlined"
                    margin="dense"
                    value={patientPhone}
                    readOnly
                    helperText="This is the phone number of the selected patient"
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleValidation} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default CreateMedicalHistory;
