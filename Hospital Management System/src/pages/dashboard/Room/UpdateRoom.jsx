import axios from 'axios';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Select, FormControl, InputLabel, Typography, Modal, InputAdornment, MenuItem, FormHelperText } from '@mui/material';
import Cookies from 'js-cookie';

const ErrorModal = lazy(() => import('../../../components/ErrorModal'));

function UpdateRoom({ id, onClose }) {
    const [formData, setFormData] = useState({
        Room_type: '',
        Patient_ID: '',
        Room_cost: '',
        Patient_phone: '' // New state for patient phone number
    });
    const [patients, setPatients] = useState([]); // State for storing patients
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const navigate = useNavigate();
    const token = Cookies.get('token');

    const roomTypes = {
        'Standard': 50.00,
        'Deluxe': 100.00,
        'VIP': 200.00,
    };

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await axios.get('http://localhost:9004/api/patient', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setPatients(response.data);
            } catch (error) {
                console.error('Error fetching patients:', error);
            }
        };

        const fetchData = async () => {
            await fetchPatients(); // Fetch the patient list first

            try {
                const response = await axios.get(`http://localhost:9004/api/room/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const responseData = response.data;
                setOriginalData(responseData);
                setFormData({
                    Room_type: responseData.Room_type,
                    Patient_ID: responseData.Patient_ID,
                    Room_cost: responseData.Room_cost,
                    Patient_phone: '' // Initialize phone number
                });

                // Fetch patient phone number
                const patientResponse = await axios.get(`http://localhost:9004/api/patient/${responseData.Patient_ID}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setFormData(prev => ({ ...prev, Patient_phone: patientResponse.data.Phone })); // Update phone number
            } catch (error) {
                const message = error.response?.status === 401
                    ? 'Invalid or expired authentication token. Please log in again.'
                    : 'Error fetching room details.';
                setAlertMessage(message);
                setShowErrorModal(true);
            }
        };
        fetchData();
    }, [id, token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));

        if (name === 'Room_type') {
            // Update Room_cost when Room_type is changed
            const cost = roomTypes[value] || '';
            setFormData((prevState) => ({
                ...prevState,
                Room_cost: cost.toFixed(2), // Set cost with two decimal points
            }));
        }

        if (name === 'Patient_ID') {
            const selectedPatient = patients.find(patient => patient.Patient_ID === value);
            if (selectedPatient) {
                setFormData(prev => ({ ...prev, Patient_phone: selectedPatient.Phone })); // Update phone number
            }
        }
    };

    const handleUpdateRoom = async () => {
        const { Room_type, Patient_ID, Room_cost } = formData;
    
        // Validation logic
        if (!Room_type.trim()) {
            showAlert('Room type is required.');
            return;
        }
    
        if (!Patient_ID || parseInt(Patient_ID) < 1) {
            showAlert("Patient ID must be a positive number.");
            return;
        }
    
        if (!Room_cost) {
            showAlert('Room cost is required.');
            return;
        }
    
        if (!isValidDecimal(Room_cost)) {
            showAlert('Room cost must be a valid decimal (10.2).');
            return;
        }
    
        // Check if data has changed
        if (
            Room_type === originalData.Room_type &&
            parseInt(Patient_ID) === parseInt(originalData.Patient_ID) &&
            parseFloat(Room_cost) === parseFloat(originalData.Room_cost)
        ) {
            showAlert("Data must be changed before updating.");
            return;
        }
    
        try {
            // Check if the patient is valid
            await axios.get(`http://localhost:9004/api/patient/check/${Patient_ID}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            // Update the room
            await axios.put(`http://localhost:9004/api/room/update/${id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            navigate('/dashboard/room');
            window.location.reload();
        } catch (error) {
            // Handle error and display appropriate message
            if (error.response && error.response.data && error.response.data.error) {
                showAlert(error.response.data.error);
            } else {
                const message = error.response?.status === 401
                    ? 'Invalid or expired authentication token. Please log in again.'
                    : 'Error updating room. Please try again later.';
                showAlert(message);
            }
        }
    };
    
    const isValidDecimal = (value) => /^\d{0,8}(\.\d{1,2})?$/.test(value);

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && (
                    <Suspense fallback={<div>Loading...</div>}>
                        <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />
                    </Suspense>
                )}
                <Typography variant="h6" component="h1" gutterBottom>Update Room</Typography>

                <Box mb={2}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="room-type-select-label">Room Type</InputLabel>
                        <Select
                            labelId="room-type-select-label"
                            id="Room_type"
                            name="Room_type"
                            value={formData.Room_type}
                            onChange={handleChange}
                            label="Room Type"
                        >
                            <MenuItem value=""><em>Select Room Type</em></MenuItem>
                            {Object.keys(roomTypes).map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>Select the room type.</FormHelperText>
                    </FormControl>
                </Box>

                <Box mb={2}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="patient-select-label">Patient</InputLabel>
                        <Select
                            labelId="patient-select-label"
                            id="Patient_ID"
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
                        <FormHelperText>Select the patient for the room.</FormHelperText>
                    </FormControl>
                </Box>

                <TextField
                    margin="dense"
                    fullWidth
                    label="Patient Phone"
                    variant="outlined"
                    id="Patient_phone"
                    name="Patient_phone"
                    value={formData.Patient_phone}
                    readOnly // Make the phone number field read-only
                    helperText="This is the phone number of the selected patient."
                />

                <TextField
                    margin="dense"
                    fullWidth
                    label="Room Cost"
                    variant="outlined"
                    id="Room_cost"
                    name="Room_cost"
                    value={formData.Room_cost}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                    readOnly
                    helperText="The cost of the selected room."
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleUpdateRoom} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default UpdateRoom;
