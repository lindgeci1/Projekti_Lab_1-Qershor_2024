import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ErrorModal from '../../../components/ErrorModal';
import { Box, TextField, Button, Typography, Select, MenuItem, InputLabel, FormControl, Modal, FormHelperText } from '@mui/material';
import Cookies from 'js-cookie';

function UpdateAppointment({ id, onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Doctor_ID: '',
        Date: '',
        Time: '',
        Scheduled_On: '',
    });
    const [originalData, setOriginalData] = useState({}); // Store original data
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [qualifications, setQualifications] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const token = Cookies.get('token');
    useEffect(() => {
        if (id) {
            console.log("Effect triggered with ID:", id);
            fetchPatients();
            fetchDoctors();
            fetchAppointmentDetails();
        } else {
            console.warn("ID is not defined or is invalid");
        }
    }, [id]);
    
    
    
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

    const fetchAppointmentDetails = async () => {
        
        console.log("Fetching appointment details for ID:", id);
        try {
            const response = await axios.get(`http://localhost:9004/api/appointment/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = response.data; 
            console.log("Appointment details fetched:", response.data);
            setOriginalData(data); // Store the original data
            setFormData({
                Patient_ID: data.Patient_ID || '',
                Doctor_ID: data.Doctor_ID || '',
                Date: data.Date,
                Time: data.Time ? data.Time.substring(0, 5) : '',
                Scheduled_On: data.Scheduled_On,
            });

            await fetchDoctorQualifications(data.Doctor_ID);
            await fetchPatientPhone(data.Patient_ID);
        } catch (error) {
            console.error('Error fetching appointment details:', error);
            showAlert('Error fetching appointment details.');
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => {
            const updatedState = { ...prevState, [name]: value };
            console.log('Updated Form Data:', updatedState); // Log updated state
            return updatedState;
        });
        // Fetch qualifications and phone if Doctor_ID or Patient_ID changes
        if (name === 'Doctor_ID') {
            fetchDoctorQualifications(value);
        }
        if (name === 'Patient_ID') {
            fetchPatientPhone(value);
        }
    };
    const handleValidation = async () => {
        const { Patient_ID, Doctor_ID, Date, Time, Scheduled_On } = formData;
    
            // console.log('Current Form Data:', formData);
            // console.log('Original Data:', originalData);
        
        if (!Patient_ID || !Doctor_ID || !Date || !Time || !Scheduled_On) {
            showAlert('All fields are required.');
            return;
        }
    
        // denseize original time to HH:mm format
        const originalTime = originalData.Time ? originalData.Time.substring(0, 5) : '';
    
        // Check if data has changed
        const dataChanged =
            Patient_ID !== originalData.Patient_ID ||
            Doctor_ID !== originalData.Doctor_ID ||
            Date !== originalData.Date ||
            Time !== originalTime || // Compare with denseized original time
            Scheduled_On !== originalData.Scheduled_On;
    
        if (!dataChanged) {
            showAlert('Data must be changed before updating.');
            return;
        }
    
        try {
            await axios.put(`http://localhost:9004/api/appointment/update/${id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Error updating appointment:', error);
            if (error.response && error.response.status === 409) {
                showAlert('Doctor is busy at this time, please choose another date or time.');
            } else {
                showAlert('Error updating appointment. Please try again.');
            }
        }
    };
    
    

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    const closeErrorModal = () => {
        setShowErrorModal(false);
    };


    return (
         <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && <ErrorModal message={alertMessage} onClose={closeErrorModal} />}
                <Typography variant="h6" component="h1" gutterBottom>Update Appointment</Typography>

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
                    <FormHelperText>Select the patient for the appointment</FormHelperText>
                </FormControl>

                <TextField
                    fullWidth
                    margin="dense"
                    label="Patient Phone"
                    variant="outlined"
                    value={patientPhone}
                    readOnly
                    helperText="Phone number of the selected patient"
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
                    <FormHelperText>Select the doctor for the appointment</FormHelperText>
                </FormControl>

                <TextField
                    fullWidth
                    margin="dense"
                    label="Qualifications"
                    variant="outlined"
                    value={qualifications}
                    readOnly
                    helperText="Qualifications of the selected doctor"
                />
{/* 
                <TextField
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
                    helperText="Date of the appointment (disabled)"
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
                    <Button variant="contained" color="primary" onClick={handleValidation} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default UpdateAppointment;
