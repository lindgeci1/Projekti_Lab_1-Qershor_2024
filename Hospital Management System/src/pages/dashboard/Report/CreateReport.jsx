import React, { useState, useEffect, Suspense, lazy } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { Box, Button, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import Cookies from 'js-cookie';

const ErrorModal = lazy(() => import('../../../components/ErrorModal'));

const CreateReport = ({ onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    personalNumber: '',
    patientName: '',
    age: '',
    patientGender: '',
    bloodType: '',
    Time: '',
    doctorName: '',
    doctorEmail: '',
    email: '',
    phone: '',
    condition: '',
    therapy: '',
    dateOfVisit: '',
    roomCost: '',
    medicineCost: ''  // New attribute for medicine cost
  });
  
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const token = Cookies.get('token');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:9004/api/patient', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setPatients(response.data);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, [token]);
  
  const fetchRoomCost = async (patientId) => {
    try {
      const response = await axios.get(`http://localhost:9004/api/patient/${patientId}/room-cost`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setFormData(prevFormData => ({
        ...prevFormData,
        roomCost: response.data.Room_Cost
      }));
    } catch (error) {
      console.error('Error fetching room cost:', error);
      setModalMessage('Please assign a room to the patient before creating the report.');
      setShowModal(true);
    }
  };

  const fetchMedicineCost = async (patientId) => {  // Function to fetch medicine cost
    // console.log('Fetching medicine cost for patient ID:', patientId); // Log the patient ID
    try {
      const response = await axios.get(`http://localhost:9004/api/patients/${patientId}/medicine-cost`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // Check if costs array is present in the response
      if (response.data && Array.isArray(response.data.costs) && response.data.costs.length > 0) {
        const medicineCost = response.data.costs[0]; // Assuming the first cost is the relevant one
        setFormData(prevFormData => ({
          ...prevFormData,
          medicineCost: medicineCost // Update the medicine cost in form data
        }));
        // console.log('Medicine cost fetched:', medicineCost); // Log the fetched medicine cost
      } else {
        console.warn('Medicine cost not found in response:', response.data); // Warn if costs array is empty
        setModalMessage('Medicine cost not found.');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching medicine cost:', error);
      setModalMessage('Please assign medicine to the patient before creating the report.');
      setShowModal(true);
    }
  };
  
  
  const checkExistingReport = async (patientId) => {
    try {
        const response = await axios.get(`http://localhost:9004/api/reports/check/${patientId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        // console.log('API Response:', response.data); // Log the full response

        const exists = response.data.hasReport; // Access the correct property
        // console.log("To check if it exists:", exists); 
        
        if (exists) {
            console.log('This patient already has a report.'); // Log message if report exists
        } else {
            console.log('No existing report for this patient. You can create a report.'); // Log message if report does not exist
        }

        return exists; // Return the correct value
    } catch (error) {
        console.error('Error checking existing report:', error);
        return false; // Default to false on error
    }
};

  
  
useEffect(() => {
  const fetchPatientVisits = async () => {
    if (!selectedPatient) {
      setFormData({
        personalNumber: '',
        patientName: '',
        age: '',
        patientGender: '',
        bloodType: '',
        Time: '',
        doctorName: '',
        doctorEmail: '',
        email: '',
        phone: '',
        condition: '',
        therapy: '',
        dateOfVisit: '',
        roomCost: '',
        medicineCost: ''
      });
      return;
    }

    try {
      // Check if the patient has any visits
      const visitCheckResponse = await axios.get(`http://localhost:9004/api/patient/${selectedPatient}/visit`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!visitCheckResponse.data) {
        setModalMessage('This patient has no visits.');
        setShowModal(true);
        return;
      }

      // Check if the patient has an existing report
      const reportExists = await checkExistingReport(selectedPatient);
      if (reportExists) {
        setModalMessage('This patient already has a report.');
        setShowModal(true);
        return;
      }

      const response = await axios.get(`http://localhost:9004/api/visit/patient/${selectedPatient}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const visits = response.data;
      if (!Array.isArray(visits) || visits.length === 0) {
        setModalMessage('No visits found for this patient.');
        setShowModal(true);
        return;
      }

      const visit = visits[0];
      const patient = visit.Patient;
      const doctor = visit.Doctor.Staff;

      setFormData({
        personalNumber: patient.Personal_Number,
        patientName: `${patient.Patient_Fname} ${patient.Patient_Lname}`,
        age: calculateAge(patient.Birth_Date),
        patientGender: patient.Gender,
        bloodType: patient.Blood_type,
        Time: visit.Time,
        doctorName: `${doctor.Emp_Fname} ${doctor.Emp_Lname}`, // Combining first and last name
        doctorEmail: `${doctor.Email}`, // Fetching doctor's email
        email: patient.Email,
        phone: patient.Phone,
        condition: visit.condition,
        therapy: visit.therapy,
        dateOfVisit: visit.date_of_visit,
        roomCost: '', // Initialize room cost
        medicineCost: '' // Initialize medicine cost
      });

      // Fetch room cost and medicine cost for the selected patient
      await fetchRoomCost(selectedPatient);
      await fetchMedicineCost(selectedPatient);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setModalMessage('Visits not found.');
      } else {
        console.error('Error fetching visit data:', error);
        setModalMessage('Error fetching visit data.');
      }
      setShowModal(true);
    }
  };

  fetchPatientVisits();
}, [selectedPatient, token]);



  const calculateAge = birthDate => {
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const createAndDownloadPdf = async () => {
    // Check for empty fields and show modal if any required field is missing
    if (
      !formData.personalNumber ||
      !formData.patientName ||
      !formData.age ||
      !formData.patientGender ||
      !formData.bloodType ||
      !formData.Time ||
      !formData.doctorName ||
      !formData.doctorEmail ||
      !formData.email ||
      !formData.phone
    ) {
      setModalMessage('Please fill in all fields before creating PDF.');
      setShowModal(true);
      return;
    }

    try {
      const pdfResponse = await axios.post(
        'http://localhost:9004/api/report/create-pdf',
        {
          ...formData
        },
        {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Create and download the PDF file
      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      saveAs(blob, `${formData.personalNumber}_Report.pdf`);

      // Show success message
      setModalMessage('PDF created successfully.');
      setShowModal(true);
    } catch (error) {
      setModalMessage('Error creating PDF.');
      setShowModal(true);
      console.error('Error:', error);
    }
  };


  const sendEmailWithPdf = async () => {
    if (
      !formData.personalNumber ||
      !formData.patientName ||
      !formData.age ||
      !formData.patientGender ||
      !formData.bloodType ||
      !formData.Time ||
      !formData.doctorName ||
      !formData.doctorEmail ||
      !formData.email ||
      !formData.phone 
    ) {
      setModalMessage('Please fill in all fields before sending email.');
      setShowModal(true);
      return;
    }

    try {
      await axios.post(
        'http://localhost:9004/api/report/send-email',
        {
          email: formData.email,
          patientName: formData.patientName,
          roomCost: formData.roomCost, // Include medicineCost in the email body
          medicineCost: formData.medicineCost  // Include medicine cost
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setModalMessage('Email sent successfully.');
      setShowModal(true);
    } catch (error) {
      setModalMessage('Error sending email.');
      setShowModal(true);
      console.error('Error:', error);
    }
  };

const createPdfAndSaveToDb = async () => {
    // Check for empty fields
    if (
        !formData.personalNumber ||
        !formData.patientName ||
        !formData.age ||
        !formData.patientGender ||
        !formData.bloodType ||  
        !formData.Time ||
        !formData.doctorName ||
        !formData.doctorEmail ||
        !formData.email ||
        !formData.phone 
    ) {
        setModalMessage('Please fill in all fields before saving report.');
        setShowModal(true);
        return;
    }

    // Check if a report already exists for the selected patient
    // console.log('Selected Patient ID:', selectedPatient);

    // Check if a report already exists for the selected patient
    const reportExists = await checkExistingReport(selectedPatient);
    // console.log('Report exists:', reportExists);

    if (reportExists) {
        setModalMessage('This patient already has a report. You cannot create another one.');
        setShowModal(true);
        return; // Prevent saving if a report already exists
    }
    // Proceed with report creation if no existing report
    try {
        const pdfResponse = await axios.post(
            'http://localhost:9004/api/report/create-pdf',
            {
                ...formData
            },
            {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const formDataWithPdf = new FormData();
        formDataWithPdf.append('personal_number', formData.personalNumber);
        formDataWithPdf.append('report', blob, `${formData.personalNumber}_Report.pdf`);
        formDataWithPdf.append('Patient_ID', selectedPatient); // Add patient ID

        for (const key in formData) {
            formDataWithPdf.append(key, formData[key]);
        }

        await axios.post('http://localhost:9004/api/report/save-report-to-db', formDataWithPdf, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });

        setModalMessage('Report saved successfully.');
        setShowModal(true);
        onSaveSuccess(); 
        // Call the onSaveSuccess function
    } catch (error) {
        console.error('Error saving report:', error);
        setModalMessage('Error saving report.');
        setShowModal(true);
    }
};

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
  };
  return (
    <Box className="report-container" p={6} maxWidth="md" mx="auto" bgcolor="white" borderRadius={2} boxShadow={2}>
      <Box display="flex" justifyContent="flex-start" mb={2}>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </Box>
      <Box mb={4}>
        <FormControl fullWidth variant="outlined">
          <InputLabel>Select Patient</InputLabel>
          <Select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            label="Select Patient"
          >
            <MenuItem value="">
              <em>Select a patient</em>
            </MenuItem>
            {patients.map((patient) => (
              <MenuItem key={patient.Patient_ID} value={patient.Patient_ID}>
                {patient.Patient_Fname} {patient.Patient_Lname}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Patient Information
        </Typography>
        {Object.keys(formData).map((key) => (
          <Box mb={2} key={key}>
            <Typography variant="body1">
              <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:</strong> {formData[key]}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Button variant="contained" color="primary" onClick={createPdfAndSaveToDb}>
          Save Report
        </Button>
        <Button variant="contained" color="success" onClick={createAndDownloadPdf}>
          Download PDF
        </Button>
        <Button variant="contained" color="info" onClick={sendEmailWithPdf}>
          Send Email
        </Button>
      </Box>
      {showModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <ErrorModal message={modalMessage} onClose={closeModal} />
        </Suspense>
      )}
    </Box>
  );
};

export default CreateReport;
