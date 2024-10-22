import axios from 'axios';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, TextField, Button, Typography, Select, MenuItem, InputLabel, FormControl, Modal, InputAdornment, FormHelperText } from '@mui/material';
import Cookies from 'js-cookie';

const ErrorModal = lazy(() => import('../../../components/ErrorModal'));

function CreateRoom({ onClose }) {
    const [formData, setFormData] = useState({
        Room_type: '',
        Patient_ID: '',
    });
    const [patients, setPatients] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [patientPhone, setPatientPhone] = useState(''); // New state for the patient's phone
    const navigate = useNavigate();
    const location = useLocation();
    const token = Cookies.get('token');

    // Room types with their corresponding costs
    const roomTypes = {
        'Standard': 50.00,
        'Deluxe': 100.00,
        'VIP': 200.00,
    };

    const [roomCost, setRoomCost] = useState(''); // State to store the dynamic room cost

    useEffect(() => {
        fetchPatients();
        const patientId = location.state?.patientId;
        if (patientId) {
            setFormData((prevState) => ({ ...prevState, Patient_ID: patientId }));
            fetchPatientPhone(patientId); // Fetch phone number for the selected patient
        }
    }, [location.state]);

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
            setPatientPhone(response.data.Phone); // Assuming the response contains the Phone field
        } catch (error) {
            console.error('Error fetching patient phone:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));

        if (name === 'Room_type') {
            setRoomCost(roomTypes[value] || ''); // Set room cost based on selected room type
        }

        // If the selected patient changes, fetch the new patient's phone
        if (name === 'Patient_ID') {
            fetchPatientPhone(value);
        }
    };

    const handleAddRoom = async () => {
        const completeFormData = { ...formData, Room_cost: roomCost }; // Add the room cost to the formData before submitting
        try {
            await axios.post('http://localhost:9004/api/room/create', completeFormData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            navigate('/dashboard/room');
            window.location.reload();
        } catch (error) {
            console.error('Error adding room:', error);
            setAlertMessage('Error adding room. Please try again.');
            setShowErrorModal(true);
        }
    };
    const handleValidation = async () => {
        const { Room_type, Patient_ID } = formData;
    
        if (Room_type === '' || Patient_ID === '' || roomCost === '') {
            showAlert('All fields are required');
            return;
        }
        if (parseInt(Patient_ID) < 1) {
            showAlert('Patient ID cannot be less than 1');
            return;
        }
    
        try {
            // Check if patient exists
            await axios.get(`http://localhost:9004/api/patient/check/${Patient_ID}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            // Call the backend to add the room and trigger backend validation
            const completeFormData = { ...formData, Room_cost: roomCost };
            const response = await axios.post('http://localhost:9004/api/room/create', completeFormData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            if (response.data.success) {
                navigate('/dashboard/room');
                window.location.reload();
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                showAlert(error.response.data.error); // Display backend validation error
            } else {
                console.error('Error adding room:', error);
                showAlert('Error adding room. Please try again.');
            }
        }
    };
    
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
                <Typography variant="h6" component="h1" gutterBottom>Add Room</Typography>

                {/* Room Type Selection */}
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
                {/* Patient Selection */}
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
                        <FormHelperText>Select the patient for the room </FormHelperText>
                    </FormControl>
                </Box>

                {/* Displaying Patient Phone Number */}
                <Box mb={2}>
                    <TextField
                        fullWidth
                        label="Patient Phone"
                        variant="outlined"
                        value={patientPhone}
                        InputProps={{
                            readOnly: true, // Make the input read-only
                        }}
                        helperText="This is the phone number of the selected patient"
                    />
                </Box>

                {/* Displaying Room Cost */}
                <Box mb={2}>
                    <TextField
                        fullWidth
                        label="Room Cost"
                        variant="outlined"
                        value={roomCost}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">€</InputAdornment>,
                            readOnly: true, // Room cost is read-only
                        }}
                        helperText="The cost of the selected room."
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

export default CreateRoom;
