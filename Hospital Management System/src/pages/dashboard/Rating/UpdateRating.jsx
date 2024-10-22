import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ErrorModal from '../../../components/ErrorModal';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Modal, MenuItem } from '@mui/material';

function UpdateRating({ id, onClose }) {
    const [formData, setFormData] = useState({
        Emp_ID: '',
        Rating: '',
        Comments: '',
        Date: new Date().toISOString().slice(0, 10)
    });
    const [originalData, setOriginalData] = useState({});
    const [staffEmail, setStaffEmail] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const navigate = useNavigate();
    const token = Cookies.get('token');
    const [staff, setStaff] = useState([]);
    const [existingRatings, setExistingRatings] = useState([]); // To store existing ratings

    useEffect(() => {
        fetchStaff();
        fetchData();
        fetchExistingRatings(); // Fetch existing ratings when component mounts
    }, [id]);

    const fetchStaff = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/staff', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setStaff(response.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(`http://localhost:9004/api/rating/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data;
            setOriginalData(data);
            setFormData({
                Emp_ID: data.Emp_ID,
                Rating: data.Rating,
                Comments: data.Comments,
                Date: data.Date
            });
            fetchStaffEmail(data.Emp_ID);
        } catch (error) {
            console.error('Error fetching rating:', error);
            showAlert('Error fetching rating details.');
        }
    };

    const fetchExistingRatings = async () => {
        try {
            const response = await axios.get('http://localhost:9004/api/rating', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setExistingRatings(response.data); // Assuming the endpoint returns a list of ratings
        } catch (error) {
            console.error('Error fetching existing ratings:', error);
        }
    };

    const fetchStaffEmail = async (empId) => {
        try {
            const response = await axios.get(`http://localhost:9004/api/staff/${empId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setStaffEmail(response.data.Email);
        } catch (error) {
            console.error('Error fetching staff email:', error);
        }
    };

    const showAlert = (message) => {
        setAlertMessage(message);
        setShowErrorModal(true);
    };

    const handleUpdateRating = async () => {
        // Basic validation
        if (
            formData.Emp_ID === originalData.Emp_ID &&
            formData.Rating === originalData.Rating &&
            formData.Comments === originalData.Comments &&
            formData.Date === originalData.Date
        ) {
            showAlert("Data must be changed before updating.");
            return;
        }
        if (!formData.Comments.trim()) {
            showAlert("Comment cannot be empty.");
            return;
        }
        if (/\d/.test(formData.Comments)) {
            showAlert("Comments cannot contain numbers.");
            return;
        }
        if (!formData.Rating || formData.Rating < 1 || formData.Rating > 5) {
            showAlert("Rating must be between 1 and 5.");
            return;
        }
        if (!formData.Emp_ID || formData.Emp_ID < 1) {
            showAlert("Employee ID must be at least 1.");
            return;
        }
        if (formData.Comments.length > 30) {
            showAlert('Character limit reached (30).');
            return;
        }
        
        // Check if the employee has already been rated
        const existingRating = existingRatings.find(rating => rating.Emp_ID === formData.Emp_ID);
        if (existingRating && existingRating.Rating_ID !== id) {
            showAlert('Employee has already been rated');
            return;
        }

        try {
            await axios.put(`http://localhost:9004/api/rating/update/${id}`, {
                Emp_ID: formData.Emp_ID,
                Rating: formData.Rating,
                Comments: formData.Comments,
                Date: formData.Date,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            navigate('/dashboard/rating');
            window.location.reload();
        } catch (error) {
            console.error('Error updating rating:', error);
            showAlert('Error updating rating. Please try again.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));

        if (name === 'Emp_ID') {
            fetchStaffEmail(value);
        }
    };

    return (
        <Modal open onClose={onClose} className="fixed inset-0 flex items-center justify-center z-10 overflow-auto bg-black bg-opacity-50">
            <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 2, width: 400, mx: 'auto' }}>
                {showErrorModal && <ErrorModal message={alertMessage} onClose={() => setShowErrorModal(false)} />}
                <Typography variant="h6" component="h1" gutterBottom>Update Rating</Typography>
                <TextField
                    margin="dense"
                    fullWidth
                    select
                    label="Employee"
                    variant="outlined"
                    id="Emp_ID"
                    name="Emp_ID"
                    value={formData.Emp_ID}
                    onChange={handleChange}
                    helperText="Select the employee for whom you are updating the rating."
                >
                    <MenuItem value=''>Select</MenuItem>
                    {staff.map((staff) => (
                        <MenuItem key={staff.Emp_ID} value={staff.Emp_ID}>
                            {`${staff.Emp_Fname} ${staff.Emp_Lname}`}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    fullWidth
                    label="Staff Email"
                    variant="outlined"
                    value={staffEmail}
                    readOnly
                    helperText="Email of the selected staff member"
                    disabled
                />
                
                <TextField
                    margin="dense"
                    fullWidth
                    select
                    label="Rating"
                    variant="outlined"
                    id="Rating"
                    name="Rating"
                    value={formData.Rating}
                    onChange={handleChange}
                    helperText="Select a rating from 1 to 5."
                >
                    <MenuItem value='' disabled>Select Rating</MenuItem>
                    {[1, 2, 3, 4, 5].map(rating => (
                        <MenuItem key={rating} value={rating}>{rating}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    margin="dense"
                    fullWidth
                    label="Comments"
                    variant="outlined"
                    id="Comments"
                    name="Comments"
                    value={formData.Comments}
                    onChange={handleChange}
                    helperText="Enter your comments (max 30 characters)."
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleUpdateRating} sx={{ mr: 1 }}>Submit</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    );
}

export default UpdateRating;
