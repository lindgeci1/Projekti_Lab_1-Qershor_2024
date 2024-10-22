import axios from 'axios';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, FormHelperText, Typography, InputLabel, MenuItem, Select, FormControl, Modal } from '@mui/material';
import Cookies from 'js-cookie';

const ErrorModal = lazy(() => import('../../../components/ErrorModal'));

function UpdateVisit({ id, onClose }) {
    const [formData, setFormData] = useState({
        Patient_ID: '',
        Doctor_ID: '',
        date_of_visit: '',
        condition: '',
        Time: '',
        therapy: '',
    });
    const [originalData, setOriginalData] = useState({});
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [patientPhone, setPatientPhone] = useState('');
    const [qualifications, setQualifications] = useState('');
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patientName, setPatientName] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const navigate = useNavigate();
    const token = Cookies.get('token');
    const formatTime = (time) => {
        return time.substring(0, 5); // Convert "HH:mm:ss" to "HH:mm"
    };
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [visitRes, patientRes, doctorRes] = await Promise.all([
                    axios.get(`http://localhost:9004/api/visit/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    axios.get('http://localhost:9004/api/patient', { headers: { 'Authorization': `Bearer ${token}` } }),
                    axios.get('http://localhost:9004/api/doctor', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                const visitData = visitRes.data;
                setOriginalData(visitData); // Set original data
                const patient = patientRes.data.find(p => p.Patient_ID === visitData.Patient_ID);
                const doctor = doctorRes.data.find(d => d.Doctor_ID === visitData.Doctor_ID);
                
                setFormData({
                    Patient_ID: visitData.Patient_ID,
                    Doctor_ID: visitData.Doctor_ID,
                    date_of_visit: visitData.date_of_visit,
                    condition: visitData.condition,
                    Time: formatTime(visitData.Time), // Format the time correctly
                    therapy: visitData.therapy,
                });
                setPatientName(patient ? `${patient.Patient_Fname} ${patient.Patient_Lname}` : 'Unknown');
                setDoctorName(doctor ? `${doctor.Staff.Emp_Fname} ${doctor.Staff.Emp_Lname}` : 'Unknown');
                setPatients(patientRes.data); // Store patients for dropdown
                setDoctors(doctorRes.data); // Store doctors for dropdown

                // Fetch additional data after setting the form data
                await fetchPatientPhone(visitData.Patient_ID);
                await fetchDoctorQualifications(visitData.Doctor_ID);
            } catch (error) {
                const message = error.response?.status === 401
                    ? 'Invalid or expired authentication token. Please log in again.'
                    : 'Error fetching visit details.';
                setAlertMessage(message);
                setShowErrorModal(true);
            }
        };

        fetchData();
    }, [id, token]);

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

    const handleUpdateVisit = async () => {
        const { Patient_ID, Doctor_ID, date_of_visit, condition, Time, therapy } = formData;
    
        // Ensure all fields are filled
        if (Patient_ID === '' || Doctor_ID === '' || date_of_visit === '' || condition === '' || Time === '' || therapy === '') {
            showAlert('All fields are required.');
            return;
        }
    
        // Check if data has changed
        const dataChanged =
            Patient_ID !== originalData.Patient_ID ||
            Doctor_ID !== originalData.Doctor_ID ||
            date_of_visit !== originalData.date_of_visit ||
            condition !== originalData.condition ||
            Time !== originalData.Time ||
            therapy !== originalData.therapy;
    
        if (!dataChanged) {
            showAlert('Data must be changed before updating.');
            return;
        }
    
        try {
            const response = await axios.put(`http://localhost:9004/api/visit/update/${id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            // Navigate and reload only if the update is successful
            if (response.status === 200) {
                navigate('/dashboard/visit');
                window.location.reload();
            }
        } catch (error) {
            // Check if the error response exists and handle it
            if (error.response && error.response.data && error.response.data.error) {
                setAlertMessage(error.response.data.error); // Set the error message from the backend
            } else {
                setAlertMessage('Error updating visit. Please try again.');
            }
            setShowErrorModal(true);
        }
    };
    

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };
    const getTodayDate = () => {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Ensure this returns 'YYYY-MM-DD'
        return formattedDate;
    };
    

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
    <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
        {showErrorModal && (
            <Suspense fallback={<div>Loading...</div>}>
                <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />
            </Suspense>
        )}
        <Typography variant="h6" component="h1" gutterBottom>Update Visit</Typography>

        <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel id="patient-select-label">Patient</InputLabel>
            <Select
                labelId="patient-select-label"
                id="visitPatientID"
                name="Patient_ID"
                value={formData.Patient_ID}
                onChange={handleChange}
                label="Patient"
                // disabled
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
            value={patientPhone}
            readOnly
            helperText="This is the phone number of the selected patient"
            margin="dense"
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
                disabled
            >
                <MenuItem value=""><em>Select Doctor</em></MenuItem>
                {doctors.map(doctor => (
                    <MenuItem key={doctor.Doctor_ID} value={doctor.Doctor_ID}>
                        {`${doctor.Staff.Emp_Fname} ${doctor.Staff.Emp_Lname}`}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText>Select the doctor for the visit</FormHelperText>
        </FormControl>
        
        <TextField
            fullWidth
            label="Qualifications"
            variant="outlined"
            value={qualifications}
            readOnly
            margin="dense"
        />
        <FormHelperText>This is the qualifications of the selected doctor</FormHelperText>

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
                fullWidth
                label="Condition"
                variant="outlined"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
            >
                <MenuItem value="Healthy">Healthy</MenuItem>
                <MenuItem value="Minor Issues">Minor Issues</MenuItem>
                <MenuItem value="Serious Condition">Serious Condition</MenuItem>
            </Select>
            <FormHelperText>Select the condition given by the doctor</FormHelperText>
        </FormControl>

        <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="Time-label">Time</InputLabel>
            <Select
                fullWidth
                label="Time"
                variant="outlined"
                name="Time"
                value={formData.Time}
                onChange={handleChange}
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
                fullWidth
                label="Therapy"
                variant="outlined"
                name="therapy"
                value={formData.therapy}
                onChange={handleChange}
            >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
            </Select>
            <FormHelperText>Has therapy been prescribed?</FormHelperText>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleUpdateVisit} sx={{ mr: 1 }}>Submit</Button>
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
        </Box>
    </Box>
</Modal>
    );
}

export default UpdateVisit;
