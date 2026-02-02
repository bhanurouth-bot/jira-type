import React, { useState } from 'react';
import { loginUser } from './api'; // <--- Import the function from api.js

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use the function from api.js (which points to 'auth/login/')
      await loginUser(username, password); 
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', background: 'white', borderRadius: '4px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', width: '300px' }}>
      <h2 style={{ textAlign: 'center', color: '#172b4d', marginBottom: '20px' }}>Log In</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          style={{ padding: '10px', borderRadius: '3px', border: '1px solid #dfe1e6' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: '10px', borderRadius: '3px', border: '1px solid #dfe1e6' }}
        />
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ background: '#0052cc', color: 'white', border: 'none', padding: '10px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}