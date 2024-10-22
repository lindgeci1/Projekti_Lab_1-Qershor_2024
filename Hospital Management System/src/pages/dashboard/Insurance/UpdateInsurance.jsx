import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, TextField, Button, Typography, Modal, MenuItem } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';

function UpdateInsurance({ id, onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Ins_Code: '',
        End_Date: '',
        Provider: '',
        Dental: '',
    });
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [patients, setPatients] = useState([]);
    const [patientPhone, setPatientPhone] = useState(''); // New state for patient's phone number
    const token = Cookies.get('token');

    useEffect(() => {
        fetchPatients();
        fetchInsuranceData();
    }, [id]);

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

    const fetchInsuranceData = async () => {
        try {
            const response = await axios.get(`http://localhost:9004/api/insurance/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data;
            setOriginalData(data);
            setFormData({
                Patient_ID: data.Patient_ID,
                Ins_Code: data.Ins_Code,
                End_Date: data.End_Date,
                Provider: data.Provider,
                Dental: data.Dental,
            });
            fetchPatientPhone(data.Patient_ID); // Fetch phone number of the patient
        } catch (error) {
            console.error('Error fetching insurance:', error);
            showAlert('Error fetching insurance details.');
        }
    };

    const fetchPatientPhone = async (patientId) => {
        try {
            const response = await axios.get(`http://localhost:9004/api/patient/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setPatientPhone(response.data.Phone); // Assuming the response contains a `Phone` field
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
        setFormData((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleUpdateInsurance = async () => {
        // Validation logic
        if (!formData.Patient_ID || formData.Patient_ID < 1) {
            showAlert("Patient ID must be a positive number.");
            return;
        }
    
        if (!formData.Ins_Code) {
            showAlert("Insurance Code is required.");
            return;
        }
    
        if (formData.Ins_Code.length !== 7) {
            showAlert("Ins_Code must be 7 characters long");
            return;
        }
    
        if (formData.Ins_Code.startsWith('0')) {
            showAlert("Please remove the leading 0 from the Ins_Code.");
            return;
        }
    
        if (!formData.End_Date) {
            showAlert("End Date is required.");
            return;
        }
    
        if (!formData.Provider.trim()) {
            showAlert("Provider cannot be empty.");
            return;
        }
    
        if (!formData.Dental.trim()) {
            showAlert("Dental cannot be empty.");
            return;
        }
    
        if (
            formData.Patient_ID === originalData.Patient_ID &&
            formData.Ins_Code === originalData.Ins_Code &&
            formData.End_Date === originalData.End_Date &&
            formData.Provider === originalData.Provider &&
            formData.Dental === originalData.Dental
        ) {
            showAlert("Data must be changed before updating.");
            return;
        }
    
        try {
            await axios.put(`http://localhost:9004/api/insurance/update/${id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Error updating insurance:', error);
            // Check if the error response exists and set the alert message accordingly
            if (error.response && error.response.data && error.response.data.error) {
                showAlert(error.response.data.error);
            } else {
                showAlert('Error updating insurance. Please try again later.');
            }
        }
    };
    

    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
    <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
        {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
        <Typography variant="h6" component="h1" gutterBottom>Update Insurance</Typography>
        <TextField
            margin="dense"
            fullWidth
            select
            label="Patient ID"
            variant="outlined"
            id="Patient_ID"
            name="Patient_ID"
            value={formData.Patient_ID}
            onChange={handleChange}
            // disabled
            helperText="Select the patient for whom you're updating insurance"
        >
            <MenuItem value=''>Select Patient</MenuItem>
            {patients.map(patient => (
                <MenuItem key={patient.Patient_ID} value={patient.Patient_ID}>
                    {`${patient.Patient_Fname} ${patient.Patient_Lname}`}
                </MenuItem>
            ))}
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
        <TextField
            margin="dense"
            fullWidth
            label="Insurance Code"
            variant="outlined"
            id="Ins_Code"
            name="Ins_Code"
            value={formData.Ins_Code}
            onChange={handleChange}
            // disabled
            helperText="Enter the insurance code associated with the patient"
        />
        <TextField
            margin="dense"
            fullWidth
            label="End Date"
            type="date"
            variant="outlined"
            id="End_Date"
            name="End_Date"
            value={formData.End_Date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().split("T")[0] }} // Prevent past date selection
            helperText="Select the insurance end date"
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleUpdateInsurance} sx={{ mr: 1 }}>Submit</Button>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
        </Box>
    </Box>
</Modal>

    );
}

export default UpdateInsurance;
