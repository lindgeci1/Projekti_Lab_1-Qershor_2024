import React, { useEffect, useState, lazy, Suspense } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import Cookies from 'js-cookie';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Lazy load components
const CreatePatient = lazy(() => import('./CreatePatient'));
const UpdatePatient = lazy(() => import('./UpdatePatient'));

function Patient({ showCreateForm, setShowCreateForm, showUpdateForm, setShowUpdateForm, setSelectedPatientId }) {
    const [patients, setPatients] = useState([]);
    const [deletePatientId, setDeletePatientId] = useState(null);
    const [userRole, setUserRole] = useState('');
    const token = Cookies.get('token');
    const navigate = useNavigate();

    const handleUpdateButtonClick = (patientId) => {
        setSelectedPatientId(patientId);
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
    
    const handleCreateInsuranceButtonClick = (patientId) => {
        setShowCreateForm(true);
        navigate('/dashboard/insurance', { state: { patientId, showCreateForm: true } });
    };
    const handleCreateEmergencyContactButtonClick = (patientId) => {
        setShowCreateForm(true);
        navigate('/dashboard/emergency_contact', { state: { patientId, showCreateForm: true } });
    };

    const handleCreateMedicalhistorysButtonClick = (patientId) => {
        setShowCreateForm(true);
        navigate('/dashboard/medicalhistorys', { state: { patientId, showCreateForm: true } });
    };

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const decodedToken = jwtDecode(token);
                const userEmail = decodedToken.email;
                
                const userResponse = await axios.get('http://localhost:9004/api/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const currentUser = userResponse.data.find(user => user.email === userEmail);
                const role = currentUser.role;
                console.log(currentUser);
                console.log('User Role:', role); // Debug log to verify the user role
                setUserRole(role);
            } catch (err) {
                console.error('Error fetching user role:', err.response ? err.response.data : err.message);
            }
        };

        fetchUserRole();
    }, [token]);

    useEffect(() => {
        axios.get('http://localhost:9004/api/patient', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then((res) => {
            setPatients(res.data);
        })
        .catch((err) => {
            console.error(err);
        });
    }, [token]);

    const handleDelete = (id) => {
        setDeletePatientId(id);
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(`http://localhost:9004/api/patient/delete/${deletePatientId}`);
            setPatients(patients.filter(item => item.Patient_ID !== deletePatientId));
            setShowUpdateForm(false);
            setShowCreateForm(false);
        } catch (err) {
            console.error(err);
        }
        setDeletePatientId(null);
    };

    const handleCreateFormToggle = () => {
        setShowCreateForm(!showCreateForm);
        setShowUpdateForm(false);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(date));
    };

    const columns = [
        { field: 'Patient_ID', headerName: 'ID', flex: 1 }, 
        { field: 'Personal_Number', headerName: 'Personal Number', flex: 1 },
        { field: 'Patient_Fname', headerName: 'Firstname', flex: 1 },
        { field: 'Patient_Lname', headerName: 'Lastname', flex: 1 },
        { 
            field: 'Birth_Date', 
            headerName: 'Birth Date', 
            flex: 1, 
            renderCell: (params) => formatDate(params.row.Birth_Date)
        },
        { field: 'Gender', headerName: 'Gender', flex: 1 },
        { field: 'Blood_type', headerName: 'Blood Type', flex: 1 },
        { field: 'Email', headerName: 'Email', flex: 1 },
        { field: 'Phone', headerName: 'Phone', flex: 1 },
        ...(userRole !== 'doctor' ? [
            {
                field: 'update',
                headerName: 'Update',
                flex: 1,
                renderCell: (params) => (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleUpdateButtonClick(params.row.Patient_ID)}
                        startIcon={<Edit />}
                    >
                    </Button>
                )
            },] : []),
            ...(userRole == 'admin' ? [
            {
                field: 'delete',
                headerName: 'Delete',
                flex: 1,
                renderCell: (params) => (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleDelete(params.row.Patient_ID)}
                        startIcon={<Delete />}
                    >
                    </Button>
                )
            },
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
            }
,
            {
                field: 'createInsurance',
                headerName: 'Insurance',
                flex: 1,
                renderCell: (params) => (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleCreateInsuranceButtonClick(params.row.Patient_ID)}
                        startIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                            </svg>
                        }
                    >
                        
                    </Button>
                )
            }
,            
            {
                field: 'createEmergencyContact',
                headerName: 'Emergency Contact', // Updated label
                flex: 1,
                renderCell: (params) => (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleCreateEmergencyContactButtonClick(params.row.Patient_ID)}
                        startIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0 6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z" />
                            </svg>
                        }
                    >
                        {/* Emergency Contact */}
                    </Button>
                )
            }
            ,            
            {
                field: 'createmedicalhistorys',
                headerName: 'Medical history', // Updated label
                flex: 1,
                renderCell: (params) => (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleCreateMedicalhistorysButtonClick(params.row.Patient_ID)}
                        startIcon={
                            <svg data-slot="icon" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"></path>
                            </svg>
                        }
                    >
                        {/* Emergency Contact */}
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
            
            
            
        ] : [])
    ];

    return (
        <div className='container-fluid mt-4'>
            {deletePatientId && (
                <Dialog
                    open={!!deletePatientId}
                    onClose={() => setDeletePatientId(null)}
                >
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this patient record?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeletePatientId(null)} color="primary">
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
                    Patients
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

            <Suspense fallback={<div>Loading...</div>}>
                {showCreateForm && <CreatePatient onClose={() => setShowCreateForm(false)} />}
            </Suspense>

            <Box mt={4} style={{ height: '100%', width: '100%' }}>
                <DataGrid
                    rows={patients}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    getRowId={(row) => row.Patient_ID}
                />
            </Box>

            {showUpdateForm && (
                <Suspense fallback={<div>Loading...</div>}>
                    <UpdatePatient onClose={() => setShowUpdateForm(false)} />
                </Suspense>
            )}
        </div>
    );
}

export default Patient;
