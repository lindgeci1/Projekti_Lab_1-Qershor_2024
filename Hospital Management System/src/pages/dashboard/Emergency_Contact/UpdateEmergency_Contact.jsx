import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, TextField, Button, Typography, Modal, MenuItem } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';

function UpdateEmergency_Contact({ id, onClose }) {
    const [formData, setFormData] = useState({
        Contact_Name: '',
        Phone: '',
        Relation: '',
        Patient_ID: '',
    });
    const [patientPhone, setPatientPhone] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [patients, setPatients] = useState([]);
    const [emergency_contact, setEmergency_contact] = useState([]);
    const token = Cookies.get('token');

    useEffect(() => {
        fetchPatients();
        if (id) {
            fetchData();
        }
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
            showAlert('Error fetching patients.');
        }
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(`http://localhost:9004/api/emergency_contact/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data;
            if (data) {
                setOriginalData(data);
                setFormData({
                    Contact_Name: data.Contact_Name,
                    Phone: data.Phone,
                    Relation: data.Relation,
                    Patient_ID: data.Patient_ID,
                });
                setEmergency_contact([data]);  // Wrap the data in an array
                fetchPatientPhone(data.Patient_ID);
            } else {
                showAlert('No data found for this emergency contact.');
            }
        } catch (error) {
            console.error('Error fetching emergency contact:', error);
            showAlert('Error fetching emergency contact details.');
        }
    };
    

    const fetchPatientPhone = async (patientId) => {
        if (!patientId) return;
        console.log(`Fetching phone number for patient ID: ${patientId}...`);
        try {
            const response = await axios.get(`http://localhost:9004/api/patient/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Patient phone fetched successfully:', response.data.Phone);
            setPatientPhone(response.data.Phone);
        } catch (error) {
            console.error('Error fetching patient phone:', error);
            showAlert('Error fetching patient phone.');
        }
    };

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));

        if (name === 'Patient_ID') {
            fetchPatientPhone(value);
        }
    };

    const handleUpdateContact = async () => {
        if (!formData.Contact_Name.trim()) {
            showAlert("Name cannot be empty.");
            return;
        }
        if (!formData.Phone.trim() || formData.Phone.length !== 9) {
            showAlert("Phone should be 9 characters long!");
            return;
        }
        if (!formData.Relation.trim()) {
            showAlert("Relation cannot be empty.");
            return;
        }
        if (!formData.Patient_ID || formData.Patient_ID < 1) {
            showAlert("Invalid Patient ID.");
            return;
        }
        if (!/^\d+$/.test(formData.Phone)) {
            showAlert('Phone number can only contain digits.');
            return;
        }
        const validateName = (name) => /^[A-Za-z]+$/.test(name);
        
        if (!validateName(formData.Contact_Name)) {
            showAlert('Contact Name can only contain numbers');
            return;
        }
        if (
            formData.Contact_Name === originalData.Contact_Name &&
            formData.Phone === originalData.Phone &&
            formData.Relation === originalData.Relation &&
            formData.Patient_ID === originalData.Patient_ID
        ) {
            showAlert("Data must be changed before updating.");
            return;
        }
        // const existingContact = emergency_contact.find(contact => 
        //     contact.Phone === formData.Phone && contact.id !== id // Adjust id to match your data structure
        // );
    
        // if (existingContact) {
        //     showAlert('This phone number is already associated with another emergency contact.');
        //     return;
        // }
        try {
            await axios.put(`http://localhost:9004/api/emergency_contact/update/${id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onClose();
            window.location.reload();
        } catch (error) {
            // Log the error and display the server's message if it exists
            console.error('Error updating emergency contact:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || 'Error updating emergency contact.';
            showAlert(errorMessage); // Display the specific error message to the user
        }
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
                <Typography variant="h6" component="h1" gutterBottom>Update Emergency Contact</Typography>
                <TextField
                    margin="dense"
                    fullWidth
                    label="Name"
                    variant="outlined"
                    id="Contact_Name"
                    name="Contact_Name"
                    value={formData.Contact_Name}
                    onChange={handleChange}
                    helperText="Enter the name of the emergency contact"
                />
                <TextField
                    fullWidth
                    label="Phone"
                    variant="outlined"
                    margin="dense"
                    name="Phone"
                    value={formData.Phone}
                    onChange={handleChange}
                    helperText="Enter the phone number for the emergency contact"
                    // disabled
                />
                <TextField
                    margin="dense"
                    fullWidth
                    select
                    label="Relation"
                    variant="outlined"
                    id="Relation"
                    name="Relation"
                    value={formData.Relation}
                    onChange={handleChange}
                    helperText="Select the relationship to the patient"
                >
                    <MenuItem value=''>Select Relation</MenuItem>
                    <MenuItem value='Mother'>Mother</MenuItem>
                    <MenuItem value='Father'>Father</MenuItem>
                    <MenuItem value='Sister'>Sister</MenuItem>
                    <MenuItem value='Brother'>Brother</MenuItem>
                    <MenuItem value='Close Family Member'>Close Family Member</MenuItem>
                    <MenuItem value='Friend'>Friend</MenuItem>
                </TextField>
                <TextField
                    margin="dense"
                    fullWidth
                    select
                    label="Patient"
                    variant="outlined"
                    id="Patient_ID"
                    name="Patient_ID"
                    value={formData.Patient_ID}
                    onChange={handleChange}
                    helperText="Select the patient associated with this emergency contact"
                >
                    <MenuItem value=''>Select Patient</MenuItem>
                    {patients.map(patient => (
                        <MenuItem key={patient.Patient_ID} value={patient.Patient_ID}>
                            {`${patient.Patient_Fname} ${patient.Patient_Lname}`}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    margin="dense"
                    fullWidth
                    label="Patient Phone"
                    variant="outlined"
                    id="Phone"
                    name="Phone"
                    value={patientPhone}
                    helperText="This is the phone number of the associated patient"
                    disabled
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleUpdateContact} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default UpdateEmergency_Contact;
