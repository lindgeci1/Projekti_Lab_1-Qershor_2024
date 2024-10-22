import axios from 'axios';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Select, MenuItem, InputLabel, FormControl, Modal, FormHelperText } from '@mui/material';
import Cookies from 'js-cookie';

const ErrorModal = lazy(() => import('../../../components/ErrorModal'));

function CreateVisit({ onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Doctor_ID: '',
        date_of_visit: '',
        condition: '',
        Time:'',
        therapy: '',
    });
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patientPhone, setPatientPhone] = useState('');
    const [qualifications, setQualifications] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const navigate = useNavigate();
    const token = Cookies.get('token');

    useEffect(() => {
        fetchPatients();
        fetchDoctors();
    }, []);

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

    const fetchDoctors = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/doctor', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setDoctors(response.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));

         // Fetch patient phone if Patient_ID changes
         if (name === 'Patient_ID') {
            fetchPatientPhone(value);
        }

        // Fetch doctor's qualifications if Doctor_ID changes
        if (name === 'Doctor_ID') {
            fetchDoctorQualifications(value);
        }
    };
    const fetchDoctorQualifications = async (doctorId) => {
        try {
            const response = await axios.get(`http://localhost:9004/api/doctors/${doctorId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setQualifications(response.data.Qualifications);
        } catch (error) {
            console.error('Error fetching doctor qualifications:', error);
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
    const handleAddVisit = async () => {
        try {
            const response = await axios.post('http://localhost:9004/api/visit/create', formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            // Navigate and reload only if the visit creation is successful
            if (response.status === 201) {
                navigate('/dashboard/visit');
                window.location.reload();
            }
        } catch (error) {
            // Check if the error response exists and handle it
            if (error.response && error.response.data && error.response.data.error) {
                setAlertMessage(error.response.data.error); // Set the error message from the backend
            } else {
                setAlertMessage('Error adding visit. Please try again.');
            }
            setShowErrorModal(true);
        }
    };
    

    const handleValidation = async () => {
        const { Patient_ID, Doctor_ID, date_of_visit, condition, Time, therapy } = formData;

        if (Patient_ID === '' || Doctor_ID === '' || date_of_visit === '' || condition === '' || Time === '' || therapy === '') {
            showAlert('All fields are required');
            return;
        }
        if (parseInt(Patient_ID) < 1 || parseInt(Doctor_ID) < 1) {
            showAlert('Patient ID and Doctor ID cannot be less than 1');
            return;
        }

        handleAddVisit();
    };

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];  // Returns yyyy-mm-dd format
    };

    const generateTimeOptions = () => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                options.push(time);
            }
        }
        return options;
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
    <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
        {showErrorModal && (
            <Suspense fallback={<div>Loading...</div>}>
                <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />
            </Suspense>
        )}
        <Typography variant="h6" component="h1" gutterBottom>Add Visit</Typography>

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
            <FormHelperText>Select a patient for the visit</FormHelperText>
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

        <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel id="doctor-select-label">Doctor</InputLabel>
            <Select
                labelId="doctor-select-label"
                id="visitDoctorID"
                name="Doctor_ID"
                value={formData.Doctor_ID}
                onChange={handleChange}
                label="Doctor"
            >
                <MenuItem value=""><em>Select Doctor</em></MenuItem>
                {doctors.map(doctor => (
                    <MenuItem key={doctor.Doctor_ID} value={doctor.Doctor_ID}>
                        {`${doctor.Staff.Emp_Fname} ${doctor.Staff.Emp_Lname}`}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText>Select the doctor who will handle this visit</FormHelperText>
        </FormControl>

        <TextField
            fullWidth
            label="Qualifications"
            variant="outlined"
            margin="dense"
            value={qualifications}
            readOnly
            helperText="This is the qualifications of the selected doctor"
        />

        <TextField
            fullWidth
            label="Date of Visit"
            variant="outlined"
            type="date"
            id="dateOfVisit"
            name="date_of_visit"
            value={formData.date_of_visit}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: getTodayDate() }}  // Prevent selecting past dates
            margin="dense"
        />
        <FormHelperText>Select a future date for the visit</FormHelperText>

        <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="condition-label">Condition</InputLabel>
            <Select
                labelId="condition-label"
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                label="Condition"
            >
                <MenuItem value="Healthy">Healthy</MenuItem>
                <MenuItem value="Minor Issues">Minor Issues</MenuItem>
                <MenuItem value="Serious Condition">Serious Condition</MenuItem>
            </Select>
            <FormHelperText>Select the patient's condition during the visit</FormHelperText>
        </FormControl>

        <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="Time-label">Time</InputLabel>
            <Select
                labelId="Time-label"
                id="Time"
                name="Time"
                value={formData.Time}
                onChange={handleChange}
                label="Time"
            >
               <MenuItem value=""><em>Select Time</em></MenuItem>
        {generateTimeOptions().map((time) => (
            <MenuItem key={time} value={time}>
                {time}
            </MenuItem>
        ))}
            </Select>
            <FormHelperText>Select the time given by the doctor</FormHelperText>
        </FormControl>

        <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="therapy-label">Therapy</InputLabel>
            <Select
                labelId="therapy-label"
                id="therapy"
                name="therapy"
                value={formData.therapy}
                onChange={handleChange}
                label="Therapy"
            >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
            </Select>
            <FormHelperText>Has therapy been prescribed?</FormHelperText>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleValidation} sx={{ mr: 1 }}>Submit</Button>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
        </Box>
    </Box>
</Modal>
    );
}

export default CreateVisit;
