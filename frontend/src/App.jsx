import React, { useState, useEffect } from 'react';
import Board from './Board';
import Dashboard from './Dashboard';
import Login from './Login';
import Register from './Register';
import Sidebar from './Sidebar';
import CreateIssueModal from './CreateIssueModal';
import ProfileModal from './ProfileModal';
import ProjectSettingsModal from './ProjectSettingsModal'; // <--- NEW IMPORT
import api, { logoutUser, fetchProjects } from './api';

function App() {
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authView, setAuthView] = useState('login'); 

  // --- APP STATE ---
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentView, setCurrentView] = useState('board'); 
  const [search, setSearch] = useState('');
  
  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // <--- NEW STATE

  // 1. Check Login Status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch projects to see if cookie is valid
        await api.get('projects/'); 
        setIsLoggedIn(true);
        const projects = await fetchProjects();
        if (projects.length > 0) setSelectedProject(projects[0]);
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

  if (checkingAuth) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  // 2. Auth Screens
  if (!isLoggedIn) {
    if (authView === 'register') {
      return <Register onRegisterSuccess={() => setAuthView('login')} onSwitchToLogin={() => setAuthView('login')} />;
    } else {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' }}>
            <Login onLoginSuccess={() => setIsLoggedIn(true)} />
            <div style={{ marginTop: '20px', fontSize: '14px', color: '#172b4d' }}>
                Need an account? <button onClick={() => setAuthView('register')} style={{ background: 'none', border: 'none', color: '#0052cc', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>Sign Up</button>
            </div>
        </div>
      );
    }
  }

  // 3. Main Application
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
       <Sidebar currentProjectId={selectedProject?.id} onSelectProject={setSelectedProject} />

       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           {/* HEADER */}
           <div style={{ height: '50px', borderBottom: '1px solid #dfe1e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#172b4d', margin: 0 }}>
                    {selectedProject ? selectedProject.name : 'Select a Project'}
                  </h2>
                  
                  {/* NEW: Project Settings Button */}
                  {selectedProject && (
                      <button 
                        onClick={() => setIsSettingsOpen(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '5px', borderRadius: '50%', color: '#6b778c' }}
                        title="Project Settings"
                      >
                        ⚙️
                      </button>
                  )}

                  <div style={{ display: 'flex', gap: '5px', background: '#f4f5f7', padding: '3px', borderRadius: '3px' }}>
                      <button onClick={() => setCurrentView('board')} style={viewBtnStyle(currentView === 'board')}>Board</button>
                      <button onClick={() => setCurrentView('dashboard')} style={viewBtnStyle(currentView === 'dashboard')}>Dashboard</button>
                  </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                 {currentView === 'board' && (
                    <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '6px', borderRadius: '3px', border: '1px solid #dfe1e6' }} />
                 )}
                 <button onClick={() => setIsModalOpen(true)} style={{ background: '#0052cc', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>Create Issue</button>
                 
                 <button onClick={() => setIsProfileOpen(true)} style={{ background: '#dfe1e6', color: '#42526e', border: 'none', padding: '6px 10px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                    👤 Profile
                 </button>

                 <button onClick={handleLogout} style={{ color: '#5e6c84', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
              </div>
           </div>

           {/* CONTENT */}
           <div style={{ flex: 1, background: '#f4f5f7', overflow: 'hidden' }}>
               {selectedProject ? (
                   currentView === 'board' ? (
                       <Board projectId={selectedProject.id} search={search} />
                   ) : (
                       <Dashboard projectId={selectedProject.id} />
                   )
               ) : (
                   <div style={{ padding: '40px', textAlign: 'center', color: '#5e6c84' }}>Please create or select a project.</div>
               )}
           </div>
       </div>

       {/* MODALS */}
       <CreateIssueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} projectId={selectedProject?.id} />
       <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
       
       {/* NEW: Settings Modal */}
       <ProjectSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          project={selectedProject}
       />
    </div>
  );
}

const viewBtnStyle = (isActive) => ({
    background: isActive ? 'white' : 'transparent',
    color: isActive ? '#0052cc' : '#42526e',
    border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', fontWeight: '500', boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
});

export default App;