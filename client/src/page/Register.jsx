import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await axios.post('http://localhost:8080/api/auth/register', { username, email, password });
      login(result.data.token, result.data.username);
      setSuccess('Account created successfully');
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
    }
  };

  return (
    <div className='auth-card'>
      <h2 className='mb-3'>Create account</h2>
      {error && <div className='alert alert-danger'>{error}</div>}
      {success && <div className='alert alert-success'>{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className='mb-3'>
          <label className='form-label'>Username</label>
          <input className='form-control' value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className='mb-3'>
          <label className='form-label'>Email</label>
          <input type='email' className='form-control' value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className='mb-3'>
          <label className='form-label'>Password</label>
          <input type='password' className='form-control' value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type='submit' className='btn btn-success w-100'>Register</button>
      </form>
    </div>
  );
}
