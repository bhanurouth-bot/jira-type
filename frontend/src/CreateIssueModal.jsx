import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createIssue, fetchUsers } from './api';

// 1. Accept 'projectId' as a prop
export default function CreateIssueModal({ isOpen, onClose, projectId }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MED');
  const [assignee, setAssignee] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: !!isOpen
  });

  const mutation = useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      // Refresh the issues list for this specific project
      queryClient.invalidateQueries(['issues', projectId]);
      handleClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectId) {
        alert("No project selected!");
        return;
    }

    mutation.mutate({
      title,
      description,
      priority,
      status: 'TODO',
      assignee: assignee || null,
      project: projectId // <--- 2. Send the correct Project ID
    });
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('MED');
    setAssignee('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '4px', width: '500px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#172b4d' }}>Create Issue</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={labelStyle}>Title <span style={{color:'red'}}>*</span></label>
            <input 
              autoFocus
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
             <div style={{ flex: 1 }}>
                <label style={labelStyle}>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                    <option value="LOW">Low</option>
                    <option value="MED">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                </select>
             </div>
             
             <div style={{ flex: 1 }}>
                <label style={labelStyle}>Assignee</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={inputStyle}>
                    <option value="">Unassigned</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                </select>
             </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: '#42526e', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
            <button 
                type="submit" 
                disabled={mutation.isPending}
                style={{ background: '#0052cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {mutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '3px', border: '1px solid #dfe1e6', boxSizing: 'border-box', fontSize: '14px' };