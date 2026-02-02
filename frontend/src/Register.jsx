import React, { useState } from 'react';
import { registerUser } from './api';

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await registerUser(username, password, email);
      // Registration successful!
      alert("Account created! Please log in.");
      onRegisterSuccess(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '4px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', width: '320px' }}>
        <h2 style={{ textAlign: 'center', color: '#172b4d', marginBottom: '20px' }}>Sign Up</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '3px', border: '1px solid #dfe1e6' }}
          />
           <input 
            type="email" 
            placeholder="Email (Optional)" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ padding: '10px', borderRadius: '3px', border: '1px solid #dfe1e6' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '3px', border: '1px solid #dfe1e6' }}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ background: '#0052cc', color: 'white', border: 'none', padding: '10px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            Already have an account? <br/>
            <button 
                onClick={onSwitchToLogin}
                style={{ background: 'none', border: 'none', color: '#0052cc', cursor: 'pointer', textDecoration: 'underline' }}
            >
                Log In
            </button>
        </div>
      </div>
    </div>
  );
}