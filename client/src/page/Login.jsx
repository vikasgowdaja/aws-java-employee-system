import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const result = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
      const token = result.data.token;
      login(token, result.data.username, result.data.displayName);
      navigate('/');
    } catch (err) {
      setError(err.response?.data || 'Login failed');
    }
  };

  return (
    <div className='auth-card'>
      <h2 className='mb-3'>Sign in</h2>
      {error && <div className='alert alert-danger'>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className='mb-3'>
          <label className='form-label'>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className='form-control' required />
        </div>
        <div className='mb-3'>
          <label className='form-label'>Password</label>
          <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} className='form-control' required />
        </div>
        <button type='submit' className='btn btn-primary w-100'>Login</button>
      </form>
    </div>
  );
}
