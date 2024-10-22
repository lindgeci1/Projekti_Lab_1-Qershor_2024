import React, { useState } from 'react';
import axios from 'axios';
import Appointment from "./Appointment/Appointment";
import CreateAppointment from "./Appointment/CreateAppointment";
import UpdateAppointment from "./Appointment/UpdateAppointment";

export function Appointments() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null); 

    const handleUpdateButtonClick = (appointmentId) => {
        setSelectedAppointmentId(appointmentId);
        setShowCreateForm(false); // Close create form if open
        setShowUpdateForm(true); // Show the update form
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:9004/api/appointment/delete/${id}`);
            setShowCreateForm(false);
            setShowUpdateForm(false);
            setSelectedAppointmentId(null); // Reset selected ID on delete
            // Fetch and update appointment list here if needed
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    };

    const handleCloseUpdate = () => {
        setShowUpdateForm(false); // Reset the update form visibility
        setSelectedAppointmentId(null); // Reset the selected ID
    };

    return (
        <div>
<Appointment
    setShowCreateForm={setShowCreateForm}
    setShowUpdateForm={setShowUpdateForm} 
    setSelectedAppointmentId={setSelectedAppointmentId} 
    handleUpdateButtonClick={handleUpdateButtonClick}
    handleDelete={handleDelete}
/>

            {showCreateForm && <CreateAppointment onClose={() => setShowCreateForm(false)} />}
            {showUpdateForm && (
                <UpdateAppointment 
                    id={selectedAppointmentId} 
                    onClose={handleCloseUpdate} 
                />
            )}
        </div>
    );
}

export default Appointments;
