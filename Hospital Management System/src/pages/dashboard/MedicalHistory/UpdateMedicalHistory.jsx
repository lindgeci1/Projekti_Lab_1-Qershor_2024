import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, Typography, Select, MenuItem, InputLabel, FormControl, Modal, TextField, FormHelperText } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';

function UpdateMedicalHistory({ id, onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Allergies: '',
        Pre_Conditions: '',
    });
    const [patientPhone, setPatientPhone] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [patients, setPatients] = useState([]);
    const token = Cookies.get('token');
    useEffect(() => {
        fetchPatients();
    }, []);
    useEffect(() => {
        console.log("Component received id:", id); // Debugging: Check if id is passed correctly
        if (!id) return; // Ensure id is available before making the request
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:9004/api/medicalhistory/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log('Fetched data:', response.data); // Debugging: Check the fetched data
                setFormData(response.data);
                setOriginalData(response.data);
                fetchPatientPhone(response.data.Patient_ID);
            } catch (error) {
                console.error('Error fetching medical history:', error);
                showAlert('Error fetching medical history details.');
            }
        };
        fetchData();
    }, [id, token]);
    


    const fetchPatients = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/patient', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPatients(response.data);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const fetchPatientPhone = async (patientId) => {
        try {
            const response = await axios.get(`http://localhost:9004/api/patient/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPatientPhone(response.data.Phone);
        } catch (error) {
            console.error('Error fetching patient phone:', error);
        }
    };

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
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

    const handleValidation = async () => {
        const { Patient_ID, Allergies, Pre_Conditions } = formData;
    
        // Check for required fields
        if (!Allergies.trim() || !Pre_Conditions.trim()) {
            showAlert('All fields are required.');
            return;
        }
    
        // Ensure the data has changed
        if (
            Allergies === originalData.Allergies &&
            Pre_Conditions === originalData.Pre_Conditions &&
            Patient_ID === originalData.Patient_ID
        ) {
            showAlert("Data must be changed before updating.");
            return;
        }
    
        try {
            // Validate the patient ID using the patient API
            const patientResponse = await axios.get(`http://localhost:9004/api/patient/${Patient_ID}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            if (!patientResponse.data) {
                showAlert('Patient ID does not exist.');
                return;
            }
    
            // Perform the update
            await axios.put(`http://localhost:9004/api/medicalhistory/update/${id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Error updating medical history:', error);
            const message = error.response?.data?.error || 'Error updating medical history. Please try again.';
            showAlert(message);
        }
    };
    

    const closeErrorModal = () => {
        setShowErrorModal(false);
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && <ErrorModal message={alertMessage} onClose={closeErrorModal} />}
                <Typography variant="h6" component="h1" gutterBottom>Update Medical History</Typography>

                <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="patient-select-label">Patient</InputLabel>
                    <Select
    labelId="patient-select-label"
    name="Patient_ID"
    value={formData.Patient_ID || ''}
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

                <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="preconditions-select-label">Pre Conditions</InputLabel>
                    <Select
                        labelId="preconditions-select-label"
                        name="Pre_Conditions"
                        value={formData.Pre_Conditions}
                        onChange={handleChange}
                        label="Pre Conditions"
                    >
                        <MenuItem value=""><em>Select Pre-Conditions</em></MenuItem>
                        <MenuItem value="Yes">Yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </Select>
                    <FormHelperText>Select if there are any pre-existing conditions</FormHelperText>
                </FormControl>

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

export default UpdateMedicalHistory;
