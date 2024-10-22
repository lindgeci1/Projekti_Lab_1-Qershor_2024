import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Box, TextField, Button, Typography, Select, FormHelperText, MenuItem, InputLabel, FormControl } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';

function CreateInsurance({ onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Ins_Code: '',
        End_Date: '',
        Provider: '',
        Dental: '',
    });
    const [patients, setPatients] = useState([]);
    const [insurance, setInsurance] = useState([]);
    const [patientPhone, setPatientPhone] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // Get location to access state
    const token = Cookies.get('token');

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
//this part
    useEffect(() => {
        fetchPatients();
        fetchInsurance();

        const patientId = location.state?.patientId; // Get patient ID from location state
        if (patientId) {
            setFormData((prevState) => ({ ...prevState, Patient_ID: patientId })); // Set patient ID
            fetchPatientPhone(patientId); // Fetch phone number for the selected patient
        }
    }, [location.state]);

    const fetchPatients = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/patient', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setPatients(response.data);
            // Remove the auto-select logic:
            // if (response.data.length === 1) {
            //     setFormData((prev) => ({ ...prev, Patient_ID: response.data[0].Patient_ID }));
            // }
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };
    const fetchInsurance = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/insurance', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setInsurance(response.data);
        } catch (error) {
            console.error('Error fetching insurance:', error);
        }
    };

    const fetchPatientPhone = async (patientId) => {
        try {
            const response = await axios.get(`http://localhost:9004/api/patient/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setPatientPhone(response.data.Phone);
        } catch (error) {
            console.error('Error fetching patient phone:', error);
        }
    };
    const handleAddInsurance = async () => {
        try {
            await axios.post("http://localhost:9004/api/insurance/create", formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            navigate('/dashboard/insurance');
            window.location.reload();
        } catch (error) {
            // Check for the specific error from the backend
            if (error.response && error.response.status === 400) {
                // Show the specific error message from the backend
                showAlert(error.response.data.error);
            } else {
                // Handle general errors
                console.error('Error adding insurance:', error);
                showAlert('Error adding insurance. Please try again.');
            }
        }
    };
    
    

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    const handleValidation = async () => {
        const { Patient_ID, Ins_Code, End_Date, Provider, Dental } = formData;

        if (!Patient_ID || !Ins_Code || !End_Date || !Provider || !Dental) {
            showAlert('All fields are required!');
            return;
        }

        if (Ins_Code.length !== 7) {
            showAlert("Ins_Code must be 7 characters long");
            return;
        }

        if (Ins_Code.startsWith('0')) {
            showAlert("Please remove the leading 0 from the Ins_Code.");
            return;
        }

        const existingInsuranceWithCode = insurance.find(ins => ins.Ins_Code === Ins_Code);
        if (existingInsuranceWithCode) {
            showAlert('This insurance code is already in use.');
            return;
        }

        // const existingInsuranceForPatient = insurance.find(ins => ins.Patient_ID === Patient_ID);
        // if (existingInsuranceForPatient) {
        //     showAlert('This patient already has insurance records. Please choose a different patient.');
        //     return;
        // }

        const currentDate = new Date().setHours(0, 0, 0, 0);
        const selectedEndDate = new Date(End_Date).setHours(0, 0, 0, 0);
        if (selectedEndDate < currentDate) {
            showAlert('End date cannot be in the past.');
            return;
        }

        try {
            await axios.get(`http://localhost:9004/api/patient/check/${Patient_ID}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            handleAddInsurance();
        } catch (error) {
            console.error('Error checking patient ID:', error);
            showAlert('Patient ID does not exist');
        }
    };
    

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
    <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
        {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
        <Typography variant="h6" component="h1" gutterBottom>Add Insurance</Typography>
        <FormControl fullWidth margin="dense">
            <InputLabel id="patient-select-label">Patient</InputLabel>
            <Select
                labelId="patient-select-label"
                id="Patient_ID"
                name="Patient_ID"
                value={formData.Patient_ID}
                label="Patient"
                onChange={handleChange}
            >
                <MenuItem value=""><em>Select Patient</em></MenuItem>
                {patients.map((patient) => (
                    <MenuItem key={patient.Patient_ID} value={patient.Patient_ID}>
                        {`${patient.Patient_Fname} ${patient.Patient_Lname}`}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText>Select the patient for this insurance</FormHelperText>
        </FormControl>
        <TextField
            fullWidth
            label="Insurance Code"
            variant="outlined"
            margin="dense"
            name="Ins_Code"
            value={formData.Ins_Code}
            onChange={handleChange}
            type="number"
            helperText="Enter the insurance code (7 characters long)"
        />
        <TextField
            fullWidth
            type="date"
            label="End Date"
            variant="outlined"
            margin="dense"
            name="End_Date"
            value={formData.End_Date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().split("T")[0] }} // Prevent dates before today
            helperText="Select the end date for the insurance"
        />
        <TextField
            margin="dense"
            fullWidth
            select
            label="Provider"
            variant="outlined"
            id="Provider"
            name="Provider"
            value={formData.Provider}
            onChange={handleChange}
            helperText="Select if a provider is assigned"
        >
            <MenuItem value=''>Select Yes/No</MenuItem>
            <MenuItem value='No'>No</MenuItem>
            <MenuItem value='Yes'>Yes</MenuItem>
        </TextField>
        <TextField
            margin="dense"
            fullWidth
            select
            label="Dental"
            variant="outlined"
            id="Dental"
            name="Dental"
            value={formData.Dental}
            onChange={handleChange}
            helperText="Select if dental coverage is included"
        >
            <MenuItem value=''>Select Yes/No</MenuItem>
            <MenuItem value='No'>No</MenuItem>
            <MenuItem value='Yes'>Yes</MenuItem>
        </TextField>
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

export default CreateInsurance;
