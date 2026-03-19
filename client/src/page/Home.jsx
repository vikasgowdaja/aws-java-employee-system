import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';

export default function Home() {
    const [employee, setEmployee] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isAuthenticated, authToken, displayName } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadEmployee();
    }, [isAuthenticated, navigate]);

    const loadEmployee = async () => {
        try {
            setLoading(true);
            const result = await axios.get(`${API_BASE_URL}/main/employee`, {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
            });
            setEmployee(result.data);
        } catch (err) {
            setError('Could not load employees. Please check the backend server.');
        } finally {
            setLoading(false);
        }
    }

    const deleteEmployee = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/main/employee/${id}`, {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
            });
            loadEmployee();
        } catch (err) {
            setError('Delete failed. Please try again.');
        }
    }

    return (
        <div className='home-wrapper'>
            <div className='d-flex justify-content-between align-items-center mb-4'>
                <div>
                    <h1 className='display-6 text-muted'>Employee Directory</h1>
                    <p className='welcome-line mb-0'>Welcome, <span className='welcome-name'>{displayName || 'Guest'}</span></p>
                </div>
                <Link to='/addEmployee' className='btn btn-success'>Add Employee</Link>
            </div>

            <div className='card shadow-sm'>
                <div className='card-body'>
                    {error && <div className='alert alert-warning'>{error}</div>}

                    {loading ? (
                        <div className='text-center py-5'>Loading employees...</div>
                    ) : employee.length === 0 ? (
                        <div className='text-center py-5 text-muted'>No employees found.</div>
                    ) : (
                        <div className='table-responsive'>
                            <table className='table table-hover align-middle mb-0'>
                                <thead className='table-light'>
                                    <tr>
                                        <th>ID</th>
                                        <th>First Name</th>
                                        <th>Last Name</th>
                                        <th>Email</th>
                                        <th className='text-end'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employee.map((emp) => (
                                        <tr key={emp.id}>
                                            <td>{emp.id}</td>
                                            <td>{emp.firstName}</td>
                                            <td>{emp.lastName}</td>
                                            <td>{emp.email}</td>
                                            <td className='text-end'>
                                                <Link to={`/viewEmployee/${emp.id}`} className='btn btn-sm btn-outline-info me-1'>View</Link>
                                                <Link to={`/editEmployee/${emp.id}`} className='btn btn-sm btn-outline-warning me-1'>Edit</Link>
                                                <button className='btn btn-sm btn-outline-danger' onClick={() => deleteEmployee(emp.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
