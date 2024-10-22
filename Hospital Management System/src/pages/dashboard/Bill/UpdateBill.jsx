import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ErrorModal from '../../../components/ErrorModal';
import { Box, TextField, Button, Typography, Select, FormHelperText , MenuItem, InputLabel, FormControl, Modal } from '@mui/material';
import Cookies from 'js-cookie';

function UpdateBill({ id, onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Amount: '',
        Payment_Status: '',
        Description: '',
        Date_Issued: ''
    });
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [patients, setPatients] = useState([]);
    const [personalNumber, setPersonalNumber] = useState('');
    const token = Cookies.get('token');
    const [patientChanged, setPatientChanged] = useState(false);
    useEffect(() => {
        console.log(patients); // Check if patients are fetched correctly
    }, [patients]);
    useEffect(() => {
        fetchPatients();
    }, []);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:9004/api/bills/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = response.data;
                setFormData(data);
                setOriginalData(data);
                await fetchPatientPersonalNumber(data.Patient_ID);
            } catch (error) {
                console.error('Error fetching bill:', error);
                showAlert('Error fetching bill details.');
            }
        };

        fetchData();
    }, [id, token]);



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

    const fetchPatientPersonalNumber = async (patientId) => {
        if (!patientId) return; // Early return if no patientId
        try {
            const response = await axios.get(`http://localhost:9004/api/patient/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setPersonalNumber(response.data.Personal_Number);
        } catch (error) {
            console.error('Error fetching patient personal number:', error);
        }
    };

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    const handleChange = async (e) => {
        const { name, value } = e.target;

        if (name === 'Patient_ID') {
            setPatientChanged(true);
            setFormData((prevState) => ({
                ...prevState,
                Patient_ID: value,
            }));
            await fetchPatientPersonalNumber(value);
        } else {
            setFormData((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        }
    };

    const handleValidation = async () => {
        const { Amount, Payment_Status, Description, Date_Issued } = formData;

        if (!Amount.trim() || !Payment_Status.trim() || !Description.trim() || !Date_Issued.trim()) {
            showAlert('All fields are required.');
            return;
        }

        // Skip unchanged check if the patient was just changed
        if (patientChanged) {
            setPatientChanged(false);
            await updateBill();
            return;
        }

        if (
            Amount === originalData.Amount &&
            Payment_Status === originalData.Payment_Status &&
            Description === originalData.Description &&
            Date_Issued === originalData.Date_Issued
        ) {
            showAlert("Data must be changed before updating.");
            return;
        }

        await updateBill();
    };

    const updateBill = async () => {
        try {
            const response = await axios.put(`http://localhost:9004/api/bills/update/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            onClose();
            window.location.reload();
        } catch (error) {
            if (error.response) {
                // Handle error from the backend
                showAlert(error.response.data.error); // Show the error message from the backend
            } else {
                console.error('Error updating bill:', error);
                showAlert('Error updating bill.');
            }
        }
    };
    
    const closeErrorModal = () => {
        setShowErrorModal(false);
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && <ErrorModal message={alertMessage} onClose={closeErrorModal} />}
                <Typography variant="h6" component="h1" gutterBottom>Update Bill</Typography>

                <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="patient-select-label">Patient</InputLabel>
                    <Select
                        labelId="patient-select-label"
                        id="visitPatientID"
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
                    value={personalNumber}
                    readOnly
                    helperText="This is the personal number of the selected patient"
                />

                {/* <TextField
                    fullWidth
                    margin="dense"
                    label="Date Issued"
                    variant="outlined"
                    type="date"
                    id="Date_Issued"
                    name="Date_Issued"
                    value={formData.Date_Issued}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    disabled
                     helperText="The date the bill was issued"
                /> */}

                <TextField
                    fullWidth
                    margin="dense"
                    label="Description"
                    variant="outlined"
                    id="Description"
                    name="Description"
                    placeholder="Enter Description"
                    value={formData.Description}
                    onChange={handleChange}
                    disabled
                    helperText="the type of payment for this bill"
                />

                <TextField
                    fullWidth
                    margin="dense"
                    label="Amount"
                    variant="outlined"
                    type="number"
                    id="Amount"
                    name="Amount"
                    value={formData.Amount}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    disabled
                     helperText="Amount should be between 10 and 50"
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
                    <FormHelperText>Select the payment status of the bill (default is Pending)</FormHelperText>
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleValidation} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default UpdateBill;
