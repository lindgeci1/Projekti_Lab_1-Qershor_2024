import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Select, MenuItem, InputLabel, FormControl, Modal, FormHelperText } from '@mui/material';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';

function CreateAppointment({ onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Doctor_ID: '',
        Date: '',
        Time: '',
        Scheduled_On: '',
    });
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patientPhone, setPatientPhone] = useState('');
    const [qualifications, setQualifications] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const token = Cookies.get('token');
    const navigate = useNavigate();

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setFormData((prevState) => ({
            ...prevState,
            Date: today,
            Scheduled_On: today,
        }));

        fetchPatients();
        fetchDoctors();
    }, []);

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

    const fetchDoctors = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/doctors', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setDoctors(response.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));

        // Fetch patient phone if Patient_ID changes
        if (name === 'Patient_ID') {
            fetchPatientPhone(value);
        }

        // Fetch doctor's qualifications if Doctor_ID changes
        if (name === 'Doctor_ID') {
            fetchDoctorQualifications(value);
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

    const handleValidation = async () => {
        const { Patient_ID, Doctor_ID, Date, Time, Scheduled_On } = formData;

        if (!Patient_ID || !Doctor_ID || !Date || !Time || !Scheduled_On) {
            showAlert('All fields are required.');
            return;
        }

        if (!Date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            showAlert('Please enter a valid date (YYYY-MM-DD).');
            return;
        }

        if (!Time.match(/^\d{2}:\d{2}$/)) {
            showAlert('Please enter a valid time (HH:MM).');
            return;
        }

        try {
            await handleAddAppointment();
        } catch (error) {
            console.error('Error adding appointment:', error);
            showAlert('Error adding appointment. Please try again.');
        }
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

    

    const handleAddAppointment = async () => {
        try {
            await axios.post('http://localhost:9004/api/appointment/create', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            navigate('/dashboard/appointments');
            window.location.reload();
        } catch (error) {
            console.error('Error adding appointment:', error);
            // Check if the error response indicates that the doctor is busy
            if (error.response && error.response.status === 409) { // Adjust the status code based on your backend's response
                showAlert('Doctor is busy at this time, please choose another date or time.');
            } else {
                showAlert('Error adding appointment. Please try again.');
            }
        }
    };
    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
        setTimeout(() => {
            setShowErrorModal(false);
        }, 3000);
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
                <Typography variant="h6" component="h1" gutterBottom>Add Appointment</Typography>

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
                    <FormHelperText>Select the patient for this appointment</FormHelperText>
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
                    <FormHelperText>Select the doctor for this appointment</FormHelperText>
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

                {/* <TextField
                    fullWidth
                    margin="dense"
                    label="Date"
                    variant="outlined"
                    type="date"
                    id="Date"
                    name="Date"
                    value={formData.Date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    disabled
                    helperText="Automatically set to today's date"
                /> */}

<FormControl fullWidth variant="outlined" margin="dense">
    <InputLabel id="time-select-label">Time</InputLabel>
    <Select
        labelId="time-select-label"
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
    <FormHelperText>Select the time for the appointment</FormHelperText>
</FormControl>

                <TextField
                    fullWidth
                    margin="dense"
                    label="Scheduled On"
                    variant="outlined"
                    type="date"
                    id="Scheduled_On"
                    name="Scheduled_On"
                    value={formData.Scheduled_On}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                    helperText="Select the date when the appointment is scheduled"
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleValidation} sx={{ mr: 1 }}>Add Appointment</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default CreateAppointment;
