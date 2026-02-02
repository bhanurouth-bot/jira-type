import React, { useState, useEffect } from 'react';
import Board from './Board';
import Dashboard from './Dashboard';
import Login from './Login';
import Register from './Register'; // <--- New Import
import Sidebar from './Sidebar';
import CreateIssueModal from './CreateIssueModal';
import api, { logoutUser, fetchProjects } from './api';

function App() {
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  // --- APP STATE ---
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentView, setCurrentView] = useState('board'); // 'board' or 'dashboard'
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Check Login Status & Load Projects
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('projects/'); // Check token validity
        setIsLoggedIn(true);
        
        // Auto-select the first project if available
        const projects = await fetchProjects();
        if (projects.length > 0) {
            setSelectedProject(projects[0]);
        }
      } catch (err) {
        setIsLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setSelectedProject(null);
    setAuthView('login');
  };

  // 2. Loading Screen
  if (checkingAuth) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  // 3. Auth Screens (Login / Register)
  if (!isLoggedIn) {
    if (authView === 'register') {
      return (
        <Register 
            onRegisterSuccess={() => setAuthView('login')} 
            onSwitchToLogin={() => setAuthView('login')} 
        />
      );
    } else {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' }}>
            {/* Render Login Form */}
            <Login onLoginSuccess={() => setIsLoggedIn(true)} />
            
            {/* Switch to Register Button */}
            <div style={{ marginTop: '20px', fontSize: '14px', color: '#172b4d' }}>
                Need an account? {' '}
                <button 
                    onClick={() => setAuthView('register')}
                    style={{ background: 'none', border: 'none', color: '#0052cc', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                >
                    Sign Up
                </button>
            </div>
        </div>
      );
    }
  }

  // 4. Main Application
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
       
       {/* LEFT: Project Sidebar */}
       <Sidebar 
          currentProjectId={selectedProject?.id} 
          onSelectProject={setSelectedProject} 
       />

       {/* RIGHT: Main Content */}
       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           
           {/* HEADER */}
           <div style={{ height: '50px', borderBottom: '1px solid #dfe1e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'white' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#172b4d', margin: 0 }}>
                    {selectedProject ? selectedProject.name : 'Select a Project'}
                  </h2>
                  
                  {/* View Switcher (Board vs Dashboard) */}
                  <div style={{ display: 'flex', gap: '5px', background: '#f4f5f7', padding: '3px', borderRadius: '3px' }}>
                      <button onClick={() => setCurrentView('board')} style={viewBtnStyle(currentView === 'board')}>Board</button>
                      <button onClick={() => setCurrentView('dashboard')} style={viewBtnStyle(currentView === 'dashboard')}>Dashboard</button>
                  </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                 {/* Search only visible on Board */}
                 {currentView === 'board' && (
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder="Search tickets..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: '6px 10px 6px 30px', borderRadius: '3px', border: '1px solid #dfe1e6', width: '200px' }}
                        />
                         <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', opacity: 0.5 }}>🔍</span>
                    </div>
                 )}

                 <button 
                    onClick={() => setIsModalOpen(true)} 
                    style={{ background: '#0052cc', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                 >
                    Create Issue
                 </button>
                 
                 <button onClick={handleLogout} style={{ color: '#5e6c84', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
              </div>
           </div>

           {/* CONTENT AREA */}
           <div style={{ flex: 1, background: '#f4f5f7', overflow: 'hidden' }}>
               {selectedProject ? (
                   currentView === 'board' ? (
                       // Pass Project ID and Search to Board
                       <Board projectId={selectedProject.id} search={search} />
                   ) : (
                       // Pass Project ID to Dashboard
                       <Dashboard projectId={selectedProject.id} />
                   )
               ) : (
                   <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#5e6c84' }}>
                        <div style={{ fontSize: '40px', marginBottom: '20px' }}>🚀</div>
                        <div>Please create or select a project from the sidebar.</div>
                   </div>
               )}
           </div>
       </div>

       {/* MODAL */}
       <CreateIssueModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          projectId={selectedProject?.id} // Important: Pass ID
       />
    </div>
  );
}

// Styles
const viewBtnStyle = (isActive) => ({
    background: isActive ? 'white' : 'transparent',
    color: isActive ? '#0052cc' : '#42526e',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.2s'
});

export default App;