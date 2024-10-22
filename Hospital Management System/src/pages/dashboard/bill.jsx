import React, { useState } from 'react';
import axios from 'axios';
import Bill from "./Bill/Bill";
import CreateBill from './Bill/CreateBill';
import UpdateBill from './Bill/UpdateBill';

export function Bills() {
    
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [selectedBillId, setSelectedBillId] = useState(null); 

    const handleUpdateButtonClick = (billId) => {
        setSelectedBillId(billId);
        setShowUpdateForm(true);
        setShowCreateForm(false); // Close create form if open
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:9004/api/bill/delete/${id}`);
            setShowCreateForm(false);
            setShowUpdateForm(false);
            setSelectedBillId(null); // Reset selectedBillId after deletion
        } catch (error) {
            console.error('Error deleting bill:', error);
        }
    };

    return (
        <div> 
            <Bill
                showCreateForm={showCreateForm}
                setShowCreateForm={setShowCreateForm}
                handleUpdateButtonClick={handleUpdateButtonClick}
                handleDelete={handleDelete}
                setSelectedBillId={setSelectedBillId} // Ensure this is passed
                setShowUpdateForm={setShowUpdateForm}
            />
            
            {showCreateForm && <CreateBill onClose={() => setShowCreateForm(false)} />}
            {showUpdateForm && (
                <UpdateBill 
                    id={selectedBillId} 
                    onClose={() => setShowUpdateForm(false)} 
                />
            )}
        </div>
    );
}

export default Bills;
