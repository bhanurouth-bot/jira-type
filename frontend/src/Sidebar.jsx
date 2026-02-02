import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjects, createProject } from './api';

export default function Sidebar({ currentProjectId, onSelectProject }) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      queryClient.invalidateQueries(['projects']);
      setNewProjectName('');
      setIsCreating(false);
      onSelectProject(newProject); // Switch to the new project immediately
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) createMutation.mutate(newProjectName);
  };

  return (
    <div style={{ width: '240px', background: '#0747A6', color: '#deebff', display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
      <div style={{ padding: '0 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
         <div style={{ fontSize: '24px' }}>🚀</div>
         <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'white' }}>Jira Clone</h2>
      </div>

      <div style={{ padding: '0 20px', marginBottom: '10px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
        Projects
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {projects.map(project => (
          <div 
            key={project.id}
            onClick={() => onSelectProject(project)}
            style={{ 
               padding: '10px 20px', 
               cursor: 'pointer', 
               background: currentProjectId === project.id ? 'rgba(255,255,255,0.1)' : 'transparent',
               display: 'flex', alignItems: 'center', gap: '10px',
               borderLeft: currentProjectId === project.id ? '3px solid #00B8D9' : '3px solid transparent'
            }}
          >
            <div style={{ width: '24px', height: '24px', background: '#dfe1e6', borderRadius: '3px', color: '#0747A6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                {project.key.substring(0, 1)}
            </div>
            <span style={{ fontSize: '14px' }}>{project.name}</span>
          </div>
        ))}
      </div>

      {/* CREATE PROJECT BUTTON */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {isCreating ? (
              <form onSubmit={handleCreate}>
                  <input 
                    autoFocus
                    placeholder="Project Name..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    style={{ width: '100%', padding: '5px', borderRadius: '3px', border: 'none', marginBottom: '5px' }}
                  />
                  <div style={{ display: 'flex', gap: '5px' }}>
                      <button type="submit" style={{ flex: 1, background: '#00B8D9', border: 'none', borderRadius: '3px', color: '#172b4d', fontSize: '12px', cursor: 'pointer' }}>Create</button>
                      <button onClick={() => setIsCreating(false)} type="button" style={{ flex: 1, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '3px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  </div>
              </form>
          ) : (
             <button 
                onClick={() => setIsCreating(true)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '100%', padding: '8px', borderRadius: '3px', color: 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
             >
                <span style={{ fontSize: '18px' }}>+</span> Create Project
             </button>
          )}
      </div>
    </div>
  );
}