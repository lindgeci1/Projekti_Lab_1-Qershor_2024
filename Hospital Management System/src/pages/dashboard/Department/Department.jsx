import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import CreateDepartment from './CreateDepartment';
import { Button, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
function Department({ 
    showCreateForm, 
    setShowCreateForm,
    setShowUpdateForm, 
    setSelectedDepartmentIdId
}) {
    const [department, setDepartment] = useState([]);
    const [deleteDepartmentId, setDeleteDepartmentId] = useState(null);
    const token = Cookies.get('token');
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const decodedToken = jwtDecode(token);
                const userEmail = decodedToken.email;
                
                const userResponse = await axios.get('http://localhost:9004/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
                const currentUser = userResponse.data.find(user => user.email === userEmail);
                const role = currentUser.role;
                console.log('User Role:', role); // Debug log to verify the user role
                setUserRole(role);
            } catch (err) {
                console.error('Error fetching user role:', err.response ? err.response.data : err.message);
            }
        };

        fetchUserRole();
    }, [token]);
    useEffect(() => {
        axios.get('http://localhost:9004/api/department', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then((res) => {
                setDepartment(res.data);
            })
            .catch((err) => console.log(err));
    }, [token]);

    const handleUpdateButtonClick = (departmentId) => {
        setSelectedDepartmentIdId(departmentId);
        setShowUpdateForm((prevState) => prevState === departmentId ? null : departmentId);
        if (showCreateForm) {
            setShowCreateForm(false); 
        }
    };
    
    const handleDelete = (id) => {
        setDeleteDepartmentId(id);
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(`http://localhost:9004/api/department/delete/${deleteDepartmentId}`);
            setDepartment(department.filter((item) => item.Dept_ID !== deleteDepartmentId));
            setShowUpdateForm(false);
            setShowCreateForm(false);
        } catch (err) {
            console.log(err);
        }
        setDeleteDepartmentId(null);
    };

    const handleCreateFormToggle = () => {
        setShowCreateForm(!showCreateForm);
        setShowUpdateForm(false); 
    };
    
    const columns = [
        { field: 'Dept_ID', headerName: 'ID', flex: 1 },
        { field: 'Dept_head', headerName: 'Department Head', flex: 1 },
        { field: 'Dept_name', headerName: 'Department Name', flex: 1 },
        { field: 'Emp_Count', headerName: 'Employee Count', flex: 1 },
        ...(userRole == 'admin' ? [
        {
            field: 'update',
            headerName: 'Update',
            flex: 1,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleUpdateButtonClick(params.row.Dept_ID)}
                    startIcon={<Edit />}
                >
                </Button>
            ),
        },
        {
            field: 'delete',
            headerName: 'Delete',
            flex: 1,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleDelete(params.row.Dept_ID)}
                    startIcon={<Delete />}
                >
                </Button>
            ),
        }
    ] : [])
    ];
        
    return (
        <Box className='container-fluid mt-4' display="flex" flexDirection="column" flexGrow={1}>
            {deleteDepartmentId && (
                <Dialog
                    open={!!deleteDepartmentId}
                    onClose={() => setDeleteDepartmentId(null)}
                >
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this department record?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDepartmentId(null)} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteConfirm} color="secondary">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            <Box mt={4} display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                    Departments
                </Typography>
                {userRole == 'admin' && !showCreateForm && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateFormToggle}
                        startIcon={<Add />}
                    >
                    </Button>
                )}
            </Box>

            {showCreateForm && <CreateDepartment onClose={() => setShowCreateForm(false)} />}

            <Box mt={4} flexGrow={1} width="100%">
                <DataGrid
                    rows={department}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    getRowId={(row) => row.Dept_ID}
                />
            </Box>
        </Box>
    );
}

export default Department;
