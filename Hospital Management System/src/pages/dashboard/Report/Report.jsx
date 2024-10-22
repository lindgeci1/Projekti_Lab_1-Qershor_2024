import React, { useState, useEffect, Suspense, lazy } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import Cookies from 'js-cookie';
import { Add, Delete, Edit } from '@mui/icons-material';
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import { useNavigate } from 'react-router-dom';
const CreateReport = lazy(() => import('./CreateReport'));
import {jwtDecode}from 'jwt-decode';
function Report({ showCreateForm, setShowCreateForm }) {
  const [reports, setReports] = useState([]);
  const [deleteReportId, setDeleteReportId] = useState(null);
  const token = Cookies.get('token');
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  useEffect(() => {
    refreshReports();
  }, []);

  const handleCreateBillButtonClick = (patientId) => {
    setShowCreateForm(true);
    navigate('/dashboard/bills', { state: { patientId, showCreateForm: true } });
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
          // console.log(currentUser);
          // console.log('User Role:', role); // Debug log to verify the user role
          setUserRole(role);
      } catch (err) {
          console.error('Error fetching user role:', err.response ? err.response.data : err.message);
      }
  };

  fetchUserRole();
}, [token]);
const refreshReports = async () => {
    try {
        const res = await axios.get('http://localhost:9004/api/report/fetch-reports', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        // Check if res.data.reports is an array
        if (!Array.isArray(res.data.reports)) {
            throw new Error("Reports data is not an array");
        }

        const reportsWithUrls = res.data.reports.map(report => {
            const uint8Array = new Uint8Array(report.report.data);
            const blob = new Blob([uint8Array], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const createdAt = report.created_at ? new Date(report.created_at) : null;
            console.log(`Report ID: ${report.Report_ID}, Created At: ${createdAt}`); // Debug log
            return { ...report, pdfUrl: url, created_at: createdAt };
        });

        setReports(reportsWithUrls);
    } catch (err) {
        console.error('Error fetching reports:', err.response ? err.response.data : err.message);
    }
};


  const handleDelete = async (id) => {
    setDeleteReportId(id);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:9004/api/report/delete/${deleteReportId}`);
      setReports(reports.filter(item => item.Report_ID !== deleteReportId));

      if (showCreateForm) {
        setShowCreateForm(false);
      }
    } catch (err) {
      console.log(err);
    }
    setDeleteReportId(null);
  };

  const handleCreateFormToggle = () => {
    setShowCreateForm(!showCreateForm);
  };

  const openPDF = (reportData) => {
    window.open(reportData.pdfUrl, '_blank');
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return (
      <Datetime
        value={date}
        timeFormat="HH:mm:ss"
        dateFormat="DD-MM-YYYY"
        renderInput={(props,) => (
          <input {...props} disabled />
        )}
      />
    );
  };

  const columns = [
    { field: 'Report_ID', headerName: 'ID', flex: 1 },
    { field: 'personal_number', headerName: 'Personal Number', flex: 1 },
    {
      field: 'report',
      headerName: 'Report',
      flex: 1,
      renderCell: (params) => (
        <Button
          onClick={() => openPDF(params.row)}
          variant="contained"
          color="primary"
        >
          {`Report_${params.row.Report_ID}.pdf`}
        </Button>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Time created',
      flex: 1,
      renderCell: (params) => {
        const date = params.row?.created_at;
        return date ? formatDate(date) : 'N/A';
      },
    },
    {
      field: 'delete',
      headerName: 'Delete',
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="secondary"
          onClick={() => handleDelete(params.row.Report_ID)}
          startIcon={<Delete />}
        >

        </Button>
      ),
    },
    {
      field: 'createBill',
      headerName: 'Bill', // Updated label
      flex: 1,
      renderCell: (params) => (
          <Button
              variant="contained"
              color="secondary"
              onClick={() => handleCreateBillButtonClick  (params.row.Patient_ID)}
              startIcon={
                <svg data-slot="icon" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"></path>
              </svg>
              }
          >
              
          </Button>
      )
  }
  ];

  return (
    <div className='container-fluid mt-4'>
      {deleteReportId && (
        <Dialog
          open={!!deleteReportId}
          onClose={() => setDeleteReportId(null)}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this report?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteReportId(null)} color="primary">
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
          Reports
        </Typography>
        {showCreateForm ? null : (
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
          <CreateReport onClose={() => setShowCreateForm(false)} onSaveSuccess={refreshReports} />
        </Suspense>
      )}

      <Box mt={4} style={{ height: '100%', width: '100%' }}>
        <DataGrid
          rows={reports}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          getRowId={(row) => row.Report_ID}
        />
      </Box>
    </div>
  );
}

export default Report;
