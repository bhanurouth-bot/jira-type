import React, { useState, useEffect } from 'react';
import Board from './Board';
import Dashboard from './Dashboard'; // <--- Import New Component
import Login from './Login';
import CreateIssueModal from './CreateIssueModal';
import api, { logoutUser } from './api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // 1. New State for View Switching
  const [currentView, setCurrentView] = useState('board'); // 'board' or 'dashboard'

  useEffect(() => {
    api.get('issues/')
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false))
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Logout failed", error);
      setIsLoggedIn(false); 
    }
  };

  if (checkingAuth) return <div>Loading...</div>;
  if (!isLoggedIn) return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
       {/* HEADER */}
       <div style={{ padding: '0 20px', background: '#0052cc', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '50px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Project Alpha</h1>
            
            {/* NAVIGATION LINKS */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                    onClick={() => setCurrentView('board')}
                    style={navButtonStyle(currentView === 'board')}
                >
                    Board
                </button>
                <button 
                    onClick={() => setCurrentView('dashboard')}
                    style={navButtonStyle(currentView === 'dashboard')}
                >
                    Dashboard
                </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Search Bar (Only show on Board view) */}
            {currentView === 'board' && (
                <div style={{ position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '5px 10px 5px 30px', borderRadius: '3px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', width: '150px', fontSize: '13px' }} 
                    />
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px' }}>🔍</span>
                </div>
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              style={{ background: '#00B8D9', color: '#172b4d', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              + Create
            </button>
            <button 
              onClick={handleLogout} 
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '13px' }}
            >
              Logout
            </button>
          </div>
       </div>

       {/* MAIN CONTENT AREA */}
       <div style={{ flex: 1, overflow: 'hidden' }}>
            {currentView === 'board' ? (
                <Board search={search} />
            ) : (
                <Dashboard />
            )}
       </div>

       <CreateIssueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// Dynamic Style for Nav Buttons
const navButtonStyle = (isActive) => ({
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? '3px solid white' : '3px solid transparent',
    color: 'white',
    padding: '14px 10px', // matches header height roughly
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    opacity: isActive ? 1 : 0.8
});

export default App;