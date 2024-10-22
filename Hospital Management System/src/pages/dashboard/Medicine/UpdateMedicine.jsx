import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Box, TextField, Button, Typography, InputAdornment, MenuItem, FormHelperText } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';

function UpdateMedicine({ id, onClose }) {
    const [formData, setFormData] = useState({
        M_name: '',
        M_Quantity: '',
        M_Cost: '',
        Patient_ID: '',
    });
    const [patients, setPatients] = useState([]);
    const [patientPhone, setPatientPhone] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const token = Cookies.get('token');

    const medicineCosts = {
        Aspirin: 5,
        Ibuprofen: 7,
        Acetaminophen: 4,
        Amoxicillin: 10,
        Metformin: 8,
        Lisinopril: 6,
        Simvastatin: 9,
        Omeprazole: 12,
        Levothyroxine: 15,
        Sertraline: 11,
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:9004/api/medicine/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = response.data;
                setOriginalData(data);
                setFormData({
                    M_name: data.M_name,
                    M_Quantity: data.M_Quantity,
                    M_Cost: data.M_Cost,
                    Patient_ID: data.Patient_ID || '',
                });
    
                fetchPatients(); // Fetch patients after setting original data
                
                // Fetch the patient's phone number immediately after fetching the medicine details
                await fetchPatientPhone(data.Patient_ID); // Fetch patient phone using the original patient ID
    
            } catch (error) {
                console.error('Error fetching medicine:', error);
                showAlert('Error fetching medicine details.');
            }
        };
        fetchData();
    }, [id]);
    

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
        if (!patientId) return;
        try {
            const response = await axios.get(`http://localhost:9004/api/patient/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPatientPhone(response.data.Phone);
        } catch (error) {
            console.error('Error fetching patient phone:', error);
            showAlert('Error fetching patient phone.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));

        if (name === 'Patient_ID') {
            fetchPatientPhone(value); // Fetch the patient's phone when a patient is selected
        }

        if (name === 'M_name' || name === 'M_Quantity') {
            calculateCost(name === 'M_name' ? value : formData.M_name, name === 'M_Quantity' ? value : formData.M_Quantity);
        }
    };

    const calculateCost = (selectedName, selectedQuantity) => {
        if (selectedName && selectedQuantity) {
            const costPerUnit = medicineCosts[selectedName];
            const totalCost = parseFloat(selectedQuantity) * costPerUnit;
            setFormData(prevState => ({
                ...prevState,
                M_Cost: totalCost.toFixed(2),
            }));
        }
    };

    const handleUpdateMedicine = async () => {
        if (!formData.Patient_ID || !formData.M_name.trim() || !formData.M_Quantity || !formData.M_Cost) {
            showAlert('All fields are required.');
            return;
        }

        if (parseInt(formData.M_Quantity) < 1 || parseFloat(formData.M_Cost) < 1) {
            showAlert('Quantity and cost must be at least 1.');
            return;
        }

        if (
            formData.Patient_ID===originalData.Patient_ID && 
            formData.M_name === originalData.M_name &&
            formData.M_Quantity === originalData.M_Quantity &&
            formData.M_Cost === originalData.M_Cost
        ) {
            showAlert('Data must be changed before updating.');
            return;
        }

        try {
            await axios.put(`http://localhost:9004/api/medicine/update/${id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            window.location.reload();
        } catch (error) {
            console.error('Error updating medicine:', error);
            const backendMessage = error.response?.data?.error || 'Error updating medicine. Please try again.';
            showAlert(backendMessage);
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
                <Typography variant="h6" component="h1" gutterBottom>Update Medicine</Typography>

                <Box mb={1}>
                    <TextField
                        fullWidth
                        select
                        label="Patient"
                        variant="outlined"
                        name="Patient_ID"
                        value={formData.Patient_ID}
                        onChange={handleChange}
                    >
                        <MenuItem value='' disabled>Select Patient</MenuItem>
                        {patients.map(patient => (
                            <MenuItem key={patient.Patient_ID} value={patient.Patient_ID}>
                                {`${patient.Patient_Fname} ${patient.Patient_Lname}`}
                            </MenuItem>
                        ))}
                    </TextField>
                    <FormHelperText>Select the patient for this medicine</FormHelperText>
                </Box>

                <Box mb={1}>
                    <TextField
                        fullWidth
                        label="Patient Phone"
                        variant="outlined"
                        value={patientPhone}
                        readOnly
                    />
                    <FormHelperText>This is the phone number of the selected patient</FormHelperText>
                </Box>
                <Box mb={1}>
                    <TextField
                        fullWidth
                        select
                        label="Medicine Name"
                        variant="outlined"
                        id="M_name"
                        name="M_name"
                        value={formData.M_name}
                        onChange={handleChange}
                    >
                        <MenuItem value='' disabled>Select Medicine</MenuItem>
                        {Object.keys(medicineCosts).map(medicine => (
                            <MenuItem key={medicine} value={medicine}>{medicine}</MenuItem>
                        ))}
                    </TextField>
                    <FormHelperText>Select the medicine you want to update</FormHelperText>
                </Box>

                <Box mb={1}>
                    <TextField
                        fullWidth
                        select
                        label="Quantity"
                        variant="outlined"
                        id="M_Quantity"
                        name="M_Quantity"
                        value={formData.M_Quantity}
                        onChange={handleChange}
                    >
                        {[...Array(5)].map((_, index) => (
                            <MenuItem key={index + 1} value={index + 1}>
                                {index + 1}
                            </MenuItem>
                        ))}
                    </TextField>
                    <FormHelperText>Select the quantity of the medicine</FormHelperText>
                </Box>

                <Box mb={1}>
                    <TextField
                        fullWidth
                        label="Cost"
                        variant="outlined"
                        id="M_Cost"
                        name="M_Cost"
                        type="text"
                        value={formData.M_Cost}
                        readOnly
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                    />
                    <FormHelperText>This cost is calculated based on selected medicine and quantity</FormHelperText>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleUpdateMedicine} sx={{ mr: 1 }}>Update</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default UpdateMedicine;
