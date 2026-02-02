import React, { useState, useEffect } from 'react';
import Board from './Board';
import Dashboard from './Dashboard';
import Login from './Login';
import Sidebar from './Sidebar'; // <--- Import
import CreateIssueModal from './CreateIssueModal';
import api, { logoutUser, fetchProjects } from './api'; // <--- Import fetchProjects

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // NEW: Project State
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [currentView, setCurrentView] = useState('board'); 
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    const checkAuth = async () => {
        try {
            await api.get('projects/'); // Use this to check token validity
            setIsLoggedIn(true);
            
            // Auto-select first project
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
  };

  if (checkingAuth) return <div>Loading...</div>;
  if (!isLoggedIn) return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
       
       {/* 1. SIDEBAR */}
       <Sidebar 
          currentProjectId={selectedProject?.id} 
          onSelectProject={setSelectedProject} 
       />

       {/* 2. MAIN CONTENT AREA */}
       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           
           {/* HEADER */}
           <div style={{ height: '50px', borderBottom: '1px solid #dfe1e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#172b4d', margin: 0 }}>
                    {selectedProject ? selectedProject.name : 'Select a Project'}
                  </h2>
                  
                  {/* View Switcher */}
                  <div style={{ display: 'flex', gap: '5px', background: '#f4f5f7', padding: '3px', borderRadius: '3px' }}>
                      <button onClick={() => setCurrentView('board')} style={viewBtnStyle(currentView === 'board')}>Board</button>
                      <button onClick={() => setCurrentView('dashboard')} style={viewBtnStyle(currentView === 'dashboard')}>Dashboard</button>
                  </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                 {currentView === 'board' && (
                    <input 
                        type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '6px', borderRadius: '3px', border: '1px solid #dfe1e6' }}
                    />
                 )}
                 <button onClick={() => setIsModalOpen(true)} style={{ background: '#0052cc', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>Create Issue</button>
                 <button onClick={handleLogout} style={{ color: '#5e6c84', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
              </div>
           </div>

           {/* CONTENT */}
           <div style={{ flex: 1, background: '#f4f5f7', overflow: 'hidden' }}>
               {selectedProject ? (
                   currentView === 'board' ? (
                       <Board projectId={selectedProject?.id} search={search} />
                   ) : (
                       <Dashboard projectId={selectedProject.id} />
                   )
               ) : (
                   <div style={{ padding: '40px', textAlign: 'center', color: '#5e6c84' }}>Please create or select a project.</div>
               )}
           </div>
       </div>

       {/* We pass projectId to the modal so it knows where to create the ticket */}
       <CreateIssueModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          projectId={selectedProject?.id} 
       />
    </div>
  );
}

const viewBtnStyle = (isActive) => ({
    background: isActive ? 'white' : 'transparent',
    color: isActive ? '#0052cc' : '#42526e',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontWeight: '500',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
});

export default App;