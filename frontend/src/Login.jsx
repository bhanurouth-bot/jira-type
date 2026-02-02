import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    // USE THE NEW URL
    await axios.post(
      'http://127.0.0.1:8000/api/login/', 
      { username, password },
      { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true 
      }
    );
    
    onLoginSuccess();
  } catch (err) {
    console.error(err);
    setError('Invalid credentials');
  }
};

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f4f5f7' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '300px' }}>
        <h2 style={{ marginTop: 0, color: '#5e6c84' }}>Log in to Jira</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#5e6c84' }}>Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '3px', border: '1px solid #dfe1e6' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#5e6c84' }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '3px', border: '1px solid #dfe1e6' }}
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>
          Log In
        </button>
      </form>
    </div>
  );
}