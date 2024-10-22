import React, { useEffect, useState } from 'react';
import { Card, CardBody, Typography } from "@material-tailwind/react";
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export function Profile() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [usersWithoutEmail, setUsersWithoutEmail] = useState([]);
  const token = Cookies.get('token');

  useEffect(() => {
    const storedUsername = Cookies.get('username');
    const storedEmail = Cookies.get('email');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

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
    const fetchUsersWithoutEmail = async () => {
      try {
        const response = await axios.get('http://localhost:9004/api/userswithnopatientorstaff', { headers: { 'Authorization': `Bearer ${token}` } });
        setUsersWithoutEmail(response.data); // Assuming response.data is an array of user objects
        console.log('Users without existing email:', response.data); // Debug log
      } catch (err) {
        console.error('Error fetching users without email:', err.response ? err.response.data : err.message);
      }
    };

    fetchUsersWithoutEmail();
  }, [token]);
  const showAlert = (message) => {
    setAlertMessage(message);
    setShowErrorModal(true);
};
  return (
    <>
      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
        <div className="absolute inset-0 flex items-center justify-center">
        </div>
      </div>

      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          <div className="mb-10 flex items-center justify-center">
            <img className="h-32 w-32 rounded-full border-4 border-white mr-4" src="data:image/png;base64,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"/>
            <div>
              <Typography variant="h5" color="blue-gray" className="mb-1">
                Welcome, {username}!
              </Typography>
              <Typography variant="body" color="blue-gray">
                Email: {email}
              </Typography>
              <Typography variant="body" color="blue-gray">
                You're now logged in. Enjoy your experience!
              </Typography>
              {userRole !== 'admin' && ( 
  <div className="mt-4">
  {userRole === 'doctor' && (
    <div className="flex items-center bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
      <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1 0v-4h-1m6 8v6a1 1 0 01-1 1h-7a1 1 0 01-1-1v-6m7 0H6a1 1 0 01-1-1V9a1 1 0 011-1h2m3-3h1v3m3-3v3m-3 3v4" />
      </svg>
      <Typography variant="body" color="blue-gray" className="font-semibold">
        Please register yourself in the staff section (if you haven't registered already).
      </Typography>
    </div>
  )}
  {userRole === 'patient' && (
    <div className="flex items-center bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
      <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m-6-8h6m-7 9h1m7-8v10m-2 0a1 1 0 001 1h2a1 1 0 001-1v-9m-4 10h-4" />
      </svg>
      <Typography variant="body" color="blue-gray" className="font-semibold">
        Please register yourself in the patient section (if you haven't registered already).
      </Typography>
    </div>
  )}
</div>

)}


{/* {userRole !== 'admin' && ( // Ensure strict equality comparison
  <div className="mt-4">
    <Typography variant="h6" color="blue-gray" className="mb-1">
      Emails that contain . (for doctors):
    </Typography>
    {usersWithoutEmail.length > 0 ? (
      <ul>
        {usersWithoutEmail.filter(user => user.email.includes('.')).map((user, index) => (
          <li key={index} className="text-blue-gray">
            {user.username} - {user.email}
          </li>
        ))}
      </ul>
    ) : (
      <Typography variant="body" color="blue-gray">
        No users without email found.
      </Typography>
    )}
  </div>
)} */}

            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
