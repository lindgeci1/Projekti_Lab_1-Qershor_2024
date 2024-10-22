import React, { useState } from 'react';
import axios from 'axios';

import MedicalHistory from "./MedicalHistory/MedicalHistory";
import UpdateMedicalHistory from './MedicalHistory/UpdateMedicalHistory';
import CreateMedicalHistory from './MedicalHistory/CreateMedicalHistory';

export function MedicalHistorys() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false); // Add this state
    const [selectedMedicalHistoryId, setSelectedMedicalHistoryId] = useState(null); 

    const handleUpdateButtonClick = (medicalHistoryId) => {
        setSelectedMedicalHistoryId(medicalHistoryId);
        setShowCreateForm(false); // Close create form if open
        setShowUpdateForm(true); // Show the update form
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:9004/api/medicalhistory/delete/${id}`);
            setShowCreateForm(false);
            setShowUpdateForm(false); // Close update form if open
            setSelectedMedicalHistoryId(null); // Reset selected ID on delete
        } catch (error) {
            console.error('Error deleting medical history:', error);
        }
    };

    const handleCloseUpdate = () => {
        setShowUpdateForm(false); // Reset the update form visibility
        setSelectedMedicalHistoryId(null); // Reset the selected ID
    };

    return (
        <>
            <div> 
                <MedicalHistory
                    showCreateForm={showCreateForm}
                    setShowCreateForm={setShowCreateForm}
                    handleUpdateButtonClick={handleUpdateButtonClick}
                    handleDelete={handleDelete}
                    setSelectedMedicalHistoryId={setSelectedMedicalHistoryId} // Pass down the setter
                    setShowUpdateForm={setShowUpdateForm} // Pass down the setter for update form
                />
                
                {showCreateForm && <CreateMedicalHistory onClose={() => setShowCreateForm(false)}/>}
                {showUpdateForm && (
                    <UpdateMedicalHistory 
                        id={selectedMedicalHistoryId} 
                        onClose={handleCloseUpdate} 
                    /> 
                )}
            </div>
        </>
    );
}

export default MedicalHistorys;
