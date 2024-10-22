import React, { useEffect, useState, Suspense, lazy } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import Cookies from 'js-cookie';
import { Add, Delete, Edit } from '@mui/icons-material';
import "react-datetime/css/react-datetime.css";
import {jwtDecode} from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
const CreateVisit = lazy(() => import('./CreateVisit'));
const UpdateVisit = lazy(() => import('./UpdateVisit'));

function Visit({ showCreateForm, setShowCreateForm, showUpdateForm, setShowUpdateForm, setSelectedVisitId }) {
    const [visits, setVisits] = useState([]);
    const [deleteVisitId, setDeleteVisitId] = useState(null);
    const [userRole, setUserRole] = useState('');
    const token = Cookies.get('token');
    const navigate = useNavigate();
    const handleUpdateButtonClick = (visitId) => {
        setSelectedVisitId(visitId);
        setShowUpdateForm(true);
    };
    const handleCreateRoomButtonClick = (patientId) => {
        setShowCreateForm(true);
        navigate('/dashboard/room', { state: { patientId, showCreateForm: true } });
    };

    const handleCreateMedicineButtonClick = (patientId) => {
        setShowCreateForm(true);
        navigate('/dashboard/medicines', { state: { patientId, showCreateForm: true } });
    };

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const decodedToken = jwtDecode(token);
                const userEmail = decodedToken.email;

                const userResponse = await axios.get('http://localhost:9004/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
                const currentUser = userResponse.data.find(user => user.email === userEmail);
                const role = currentUser.role;
                console.log('User Role:', role);
                setUserRole(role);
            } catch (err) {
                console.error('Error fetching user role:', err.response ? err.response.data : err.message);
            }
        };

        fetchUserRole();
    }, [token]);

    useEffect(() => {
        const fetchVisits = async () => {
            try {
                const endpoint = 'http://localhost:9004/api/visit';
                const response = await axios.get(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = response.data; // Access the visits data directly from the response
    
                const visitsDataWithNames = data.map(visit => ({
                    ...visit,
                    Patient_Name: visit.Patient ? `${visit.Patient.Patient_Fname} ${visit.Patient.Patient_Lname}` : 'Unknown Patient',
                    Doctor_Name: visit.Doctor && visit.Doctor.Staff ? `${visit.Doctor.Staff.Emp_Fname} ${visit.Doctor.Staff.Emp_Lname}` : 'Unknown Doctor'
                }));
    
                setVisits(visitsDataWithNames);
            } catch (err) {
                console.error('Error fetching visits:', err); // Log the entire error object
            }
        };
    
        fetchVisits();
    }, [token]); // Only depend on the token
    
        

    const handleDelete = (id) => {
        setDeleteVisitId(id);
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(`http://localhost:9004/api/visit/delete/${deleteVisitId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            setVisits(visits.filter(item => item.Visit_ID !== deleteVisitId));
            setShowUpdateForm(false);
            setShowCreateForm(false);
        } catch (err) {
            console.error('Error deleting visit:', err.response ? err.response.data : err.message);
        }
        setDeleteVisitId(null);
    };

    const handleCreateFormToggle = () => {
        setShowCreateForm(!showCreateForm);
        setShowUpdateForm(false);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(date));
    };

    const columns = [
        { field: 'Visit_ID', headerName: 'ID', flex: 1 },
        { field: 'Patient_Name', headerName: 'Patient Name', flex: 1 },
        { field: 'Doctor_Name', headerName: 'Doctor Name', flex: 1 },
        { 
            field: 'date_of_visit', 
            headerName: 'Date of Visit', 
            flex: 1,
            renderCell: (params) => formatDate(params.row.date_of_visit)
        },
        { field: 'condition', headerName: 'Condition', flex: 1 },
        { field: 'Time', headerName: 'Time', flex: 1 },
        { field: 'therapy', headerName: 'Therapy', flex: 1 },
        ...(userRole !== 'patient' ? [
        {
            field: 'update',
            headerName: 'Update',
            flex: 1,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleUpdateButtonClick(params.row.Visit_ID)}
                    startIcon={<Edit />}
                >
                </Button>
            )
        }
    ] : []),
    
            {
                field: 'delete',
                headerName: 'Delete',
                flex: 1,
                renderCell: (params) => (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleDelete(params.row.Visit_ID)}
                        startIcon={<Delete />}
                    >
                    </Button>
                )
            }
        ,
        ...(userRole !== 'patient' ? [
        {
            field: 'createRoom',
            headerName: 'Room',
            flex: 1,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleCreateRoomButtonClick(params.row.Patient_ID)}
                    startIcon={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                        </svg>
                    }
                >
                
                </Button>
            )
        },
        {
            field: 'createMedicine',
            headerName: 'Medicine', // Updated label
            flex: 1,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleCreateMedicineButtonClick(params.row.Patient_ID)}
                    startIcon={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                        </svg>
                    }
                >
                    {/* Emergency Contact */}
                </Button>
            )
        }
    ] : []),
    ];

    return (
        <div className='container-fluid mt-4'>
            {deleteVisitId && (
                <Dialog
                    open={!!deleteVisitId}
                    onClose={() => setDeleteVisitId(null)}
                >
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this visit record?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteVisitId(null)} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteConfirm} color="secondary">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            
                <Box mt={4} display="flex" alignItems="center">
                    <Typography variant="h6" style={{ marginRight: 'auto' }}>
                        Visits
                    </Typography>
                    {userRole !== 'doctor' && !showCreateForm && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreateFormToggle}
                            startIcon={<Add />}
                        >
                        </Button>
                    )}
                </Box>
            

            {showCreateForm && (
                <Suspense fallback={<div>Loading...</div>}>
                    <CreateVisit onClose={() => setShowCreateForm(false)} />
                </Suspense>
            )}

            <Box mt={4} style={{ height: '100%', width: '100%' }}>
                <DataGrid
                    rows={visits}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    getRowId={(row) => row.Visit_ID}
                />
            </Box>

            {showUpdateForm && (
                <Suspense fallback={<div>Loading...</div>}>
                    <UpdateVisit onClose={() => setShowUpdateForm(false)} />
                </Suspense>
            )}
        </div>
    );
}

export default Visit;
