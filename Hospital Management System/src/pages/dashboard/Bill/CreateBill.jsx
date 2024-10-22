import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Select, MenuItem, InputLabel, FormHelperText, FormControl, Modal, TextField } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';
import { useLocation } from 'react-router-dom';

function CreateBill({ onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Date_Issued: new Date().toLocaleDateString('en-CA'), // Using 'en-CA' ensures the date is formatted as YYYY-MM-DD
        Description: '',
        Amount: '', 
        Payment_Status: 'Pending',
    })
    const [patients, setPatients] = useState([]);
    const [patientPersonalNumber, setPatientPersonalNumber] = useState('');
    const [roomCost, setRoomCost] = useState(0);
    const [medicineCost, setMedicineCost] = useState(0); // State for medicine cost
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const token = Cookies.get('token');
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedDescription, setSelectedDescription] = useState('');
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        fetchPatients();
        const patientId = location.state?.patientId; // Get patient ID from location state
        if (patientId) {
            setFormData((prevState) => ({ ...prevState, Patient_ID: patientId })); // Set patient ID
            fetchPatientPersonalNumber(patientId); // Fetch personal number for the selected patient
            fetchRoomCost(patientId); // Fetch room cost
            fetchMedicineCost(patientId); // Fetch medicine cost
        }
    }, [location.state]); // Add location.state to dependencies

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

    const handleDescriptionChange = (e) => {
        const description = e.target.value;
        setSelectedDescription(description);

        let cost = 0;
        if (description === 'Pagesa per Kontroll') {
            cost = 10;
        } 
        //test
        // Update total cost
        const updatedTotalCost = cost + roomCost + medicineCost;
        setTotalCost(updatedTotalCost);
        
        // Set the Amount field based on the updated total cost
        setFormData((prevState) => ({
            ...prevState,
            Amount: updatedTotalCost,
            Description: description // Update Description in formData
        }));
        console.log(`Updated Total Cost: ${updatedTotalCost}`); // Debugging log
    };

    const fetchPatientPersonalNumber = async (patientId) => {
        try {
            const response = await axios.get(`http://localhost:9004/api/patient/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setPatientPersonalNumber(response.data.Personal_Number);
        } catch (error) {
            console.error('Error fetching patient personal number:', error);
        }
    };

    const fetchRoomCost = async (patientId) => {
        try {
            const response = await axios.get(`http://localhost:9004/api/patient/${patientId}/room-cost`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const roomCostValue = parseFloat(response.data.Room_Cost); // Convert string to float
            setRoomCost(roomCostValue); // Update the state with the float value
            console.log('Room Cost:', roomCostValue); // Log room cost
        } catch (error) {
            console.error('Error fetching room cost:', error);
        }
    };
    
    const fetchMedicineCost = async (patientId) => {
        try {
            const response = await axios.get(`http://localhost:9004/api/patients/${patientId}/medicine-cost`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data && response.data.costs) {
                const medicineCostValue = parseFloat(response.data.costs[0]); // Convert string to float
                setMedicineCost(medicineCostValue); // Update the state with the float value
                console.log('Medicine Cost:', medicineCostValue); // Log medicine cost
            } else {
                console.warn('Medicine cost is not defined in the response:', response.data);
            }
        } catch (error) {
            console.error('Error fetching medicine cost:', error);
        }
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));

        if (name === 'Patient_ID') {
            fetchPatientPersonalNumber(value);
            fetchRoomCost(value);
            fetchMedicineCost(value);
        }
    };

    const handleAddBill = async () => {
        try {
            console.log('Adding Bill...');
        
            // Prepare the bill data with the total amount
            const billData = { ...formData, Amount: totalCost };
        
            // Send the bill data to the server
            await axios.post('http://localhost:9004/api/bills/create', billData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        
            // Navigate to bills page and reload
            navigate('/dashboard/bills');
            window.location.reload();
        } catch (error) {
            console.error('Error adding Bill:', error);
            console.log('Error response data:', error.response); // Log the error response for debugging
            
            // Check if the error response contains a specific error message
            if (error.response && error.response.data && error.response.data.error) {
                showAlert(error.response.data.error); // Show the exact error message from the backend
            } else {
                showAlert('Error adding bill. Please try again.');
            }
        }
    };
    

    const handleValidation = async () => {
        console.log('Current formData:', formData); 
        const { Patient_ID, Date_Issued, Description, Amount, Payment_Status } = formData;
    
        if (Patient_ID === '' || Date_Issued === '' || Description === '' || Amount === '' || Payment_Status === '') {
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
            handleAddBill(); // Call the function here
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
                <Typography variant="h6" component="h1" gutterBottom>Add Bill</Typography>

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
                    <FormHelperText>Select the patient for this bill</FormHelperText>
                </FormControl>

                <TextField
                    fullWidth
                    label="Patient Personal Number"
                    variant="outlined"
                    margin="dense"
                    value={patientPersonalNumber}
                    readOnly
                    helperText="This is the personal number of the selected patient"
                />

                <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="description-select-label">Description</InputLabel>
                    <Select
                        labelId="description-select-label"
                        id="Description"
                        name="Description"
                        value={selectedDescription}
                        onChange={handleDescriptionChange}
                        label="Description"
                    >
                        <MenuItem value=""><em>Select Description</em></MenuItem>
                        <MenuItem value="Pagesa per Kontroll">Pagesa per Kontroll</MenuItem>
                        {/* <MenuItem value="Pagesa per Terapi">Pagesa per Terapi</MenuItem> */}
                    </Select>
                    <FormHelperText>Select the description for this bill</FormHelperText>
                </FormControl>

                <TextField
                    fullWidth
                    label="Amount"
                    variant="outlined"
                    margin="dense"
                    value={totalCost} // Use the totalCost calculated
                    readOnly
                    helperText="The total amount for the bill"
                />

<FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="payment-status-select-label">Payment Status</InputLabel>
                    <Select
                        labelId="payment-status-select-label"
                        id="Payment_Status"
                        name="Payment_Status"
                        value={formData.Payment_Status}
                        onChange={handleChange}
                        label="Payment Status"
                    >
                        <MenuItem value=""><em>Select Payment Status</em></MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Paid">Paid</MenuItem>
                        <MenuItem value="Failed">Failed</MenuItem>
                    </Select>
                    <FormHelperText>Select the payment status</FormHelperText>
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleValidation} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default CreateBill;
