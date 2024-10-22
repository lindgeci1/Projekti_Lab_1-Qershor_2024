import React, { useState } from 'react';
import axios from 'axios';
import Payroll from "./Payroll/Payroll";
import CreatePayroll from "./Payroll/CreatePayroll";
import UpdatePayroll from "./Payroll/UpdatePayroll";

export function Payrolls() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [selectedPayrollId, setSelectedPayrollId] = useState(null); 

    const handleUpdateButtonClick = (payrollId) => {
        setSelectedPayrollId(payrollId);
        setShowCreateForm(false); // Close create form if open
        setShowUpdateForm((prevState) => prevState === payrollId ? null : payrollId); // Toggle update form visibility
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:9004/api/payroll/delete/${id}`);
            setShowCreateForm(false);
            setShowUpdateForm(false);
            setSelectedPayrollId(null); // Reset selected ID on delete
            // Fetch and update payroll list here if needed
        } catch (error) {
            console.error('Error deleting payroll:', error);
        }
    };

    const handleCloseUpdate = () => {
        setShowUpdateForm(false); // Reset the update form visibility
        setSelectedPayrollId(null); // Reset the selected ID
    };

    return (
        <div>
            <Payroll
                setShowCreateForm={setShowCreateForm}
                setShowUpdateForm={setShowUpdateForm} 
                setSelectedPayrollId={setSelectedPayrollId} 
                handleUpdateButtonClick={handleUpdateButtonClick}
                handleDelete={handleDelete}
            />
            {showCreateForm && <CreatePayroll onClose={() => setShowCreateForm(false)} />}
            {showUpdateForm && (
                <UpdatePayroll 
                    id={selectedPayrollId} 
                    onClose={handleCloseUpdate} 
                />
            )}
        </div>
    );
}

export default Payrolls;
