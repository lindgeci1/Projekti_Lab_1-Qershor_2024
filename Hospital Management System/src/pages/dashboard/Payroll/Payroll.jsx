import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import CreatePayroll from './CreatePayroll';
import { Button, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import Cookies from 'js-cookie';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Payroll({
    showCreateForm,
    setShowCreateForm,
    showUpdateForm,
    setShowUpdateForm,
    setSelectedPayrollId,
}) {
    const [payroll, setPayroll] = useState([]);
    const [deletePayrollId, setDeletePayrollId] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const token = Cookies.get('token');
    const [userRole, setUserRole] = useState('');
    const location = useLocation();

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
        const fetchData = async () => {
            try {
                const payrollRes = await axios.get('http://localhost:9004/api/payroll', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const employeesRes = await axios.get('http://localhost:9004/api/staff', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const employeesData = employeesRes.data;

                // Add employee names to the payroll data
                const payrollDataWithNames = payrollRes.data.map(payroll => {
                    const employee = employeesData.find(emp => emp.Emp_ID === payroll.Emp_ID);
                    return {
                        ...payroll,
                        Employee_Name: employee ? `${employee.Emp_Fname} ${employee.Emp_Lname}` : 'Unknown'
                    };
                });

                setPayroll(payrollDataWithNames);
                setEmployees(employeesData);
                setIsDataLoaded(true);
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };

        fetchData();
        if (location.state?.staffid && location.state?.showCreateForm) {
            setShowCreateForm(true);
        }
    }, [token, location.state, setShowCreateForm]);

    const handleUpdateButtonClick = (payrollId) => {
        setSelectedPayrollId(payrollId);
        setShowUpdateForm(true);
        if (showCreateForm) {
            setShowCreateForm(false);
        }
    };

    const handleDelete = (id) => {
        setDeletePayrollId(id);
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(`http://localhost:9004/api/payroll/delete/${deletePayrollId}`);
            setPayroll(payroll.filter((data) => data.Account_no !== deletePayrollId));
        } catch (err) {
            console.error('Error deleting payroll:', err);
        }
        setDeletePayrollId(null);
    };

    const handleCreateFormToggle = () => {
        setShowCreateForm(!showCreateForm);
        setShowUpdateForm(false);
    };

    const columns = [
        { field: 'Account_no', headerName: 'ID', flex: 1 },
        { field: 'Salary', headerName: 'Salary(Amount)', flex: 1 },
        { field: 'Employee_Name', headerName: 'Employee', flex: 1 },
        ...(userRole === 'admin' ? [
            {
                field: 'update',
                headerName: 'Update',
                flex: 1,
                renderCell: (params) => (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleUpdateButtonClick(params.row.Account_no)}
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
                        onClick={() => handleDelete(params.row.Account_no)}
                        startIcon={<Delete />}
                    >
                    </Button>
                ),
            }
        ] : [])
    ];

    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options);
    }

    return (
        <div className="container-fluid mt-4">
            {deletePayrollId && (
                <Dialog
                    open={!!deletePayrollId}
                    onClose={() => setDeletePayrollId(null)}
                >
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this payroll record?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeletePayrollId(null)} color="primary">
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
                    Payroll
                </Typography>
                {userRole === 'admin' && !showCreateForm && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateFormToggle}
                        startIcon={<Add />}
                    >
                    </Button>
                )}
            </Box>

            {showCreateForm && <CreatePayroll onClose={() => setShowCreateForm(false)} />}

            <Box mt={4} style={{ height: '100%', width: '100%' }}>
                {isDataLoaded && (
                    <DataGrid
                        rows={payroll}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10]}
                        getRowId={(row) => row.Account_no}
                        autoHeight
                        hideFooterSelectedRowCount
                    />
                )}
            </Box>
        </div>
    );
}

export default Payroll;
