import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addProjectMember } from './api';
import Avatar from './Avatar';

export default function ProjectSettingsModal({ project, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [inviteName, setInviteName] = useState('');
  const [error, setError] = useState('');

  const inviteMutation = useMutation({
    mutationFn: (username) => addProjectMember(project.id, username),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']); // Refresh project list to see new member
      setInviteName('');
      alert("User added!");
    },
    onError: () => setError("User not found or already added")
  });

  const handleInvite = (e) => {
    e.preventDefault();
    setError('');
    if (!inviteName.trim()) return;
    inviteMutation.mutate(inviteName);
  };

  if (!isOpen || !project) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <h2 style={{ margin: 0, fontSize: '20px', color: '#172b4d' }}>Project Settings</h2>
             <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        <h3 style={{ fontSize: '14px', color: '#5e6c84', textTransform: 'uppercase', marginBottom: '10px' }}>Team Members</h3>
        
        {/* MEMBER LIST */}
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Owner */}
            <div style={memberRowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar src={project.owner?.avatar} name={project.owner?.username} size={32} />
                    <span style={{ fontWeight: '500', color: '#172b4d' }}>{project.owner?.username}</span>
                </div>
                <span style={badgeStyle}>Owner</span>
            </div>

            {/* Members */}
            {project.members?.map(member => (
                <div key={member.id} style={memberRowStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar src={member.avatar} name={member.username} size={32} />
                        <span style={{ color: '#172b4d' }}>{member.username}</span>
                    </div>
                </div>
            ))}
        </div>

        {/* INVITE FORM */}
        <div style={{ borderTop: '1px solid #dfe1e6', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#172b4d' }}>Invite User</h4>
            {error && <div style={{ color: 'red', fontSize: '12px', marginBottom: '5px' }}>{error}</div>}
            
            <form onSubmit={handleInvite} style={{ display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Enter username..." 
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    style={{ flex: 1, padding: '8px', borderRadius: '3px', border: '1px solid #dfe1e6' }}
                />
                <button 
                    type="submit" 
                    disabled={inviteMutation.isPending}
                    style={{ background: '#0052cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {inviteMutation.isPending ? 'Adding...' : 'Add'}
                </button>
            </form>
        </div>

      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 };
const modalStyle = { background: 'white', padding: '30px', borderRadius: '4px', width: '450px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '4px', background: '#f4f5f7' };
const badgeStyle = { fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', background: '#dfe1e6', padding: '2px 6px', borderRadius: '3px', color: '#42526e' };