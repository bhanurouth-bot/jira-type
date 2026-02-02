import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createIssue, fetchUsers } from './api';

export default function CreateIssueModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MED');
  const [assignee, setAssignee] = useState('');

  // 1. Fetch Users for the dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isOpen, // Only fetch when modal is open to save resources
  });

  // 2. Mutation to save data
  const mutation = useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      // Refresh the board
      queryClient.invalidateQueries(['issues']);
      // Clear form
      setTitle('');
      setDescription('');
      setPriority('MED');
      setAssignee('');
      // Close modal
      onClose();
    },
    onError: (error) => {
      console.error(error);
      alert("Failed to create issue");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      project: 1, // Hardcoded Project ID (assuming "ALP" is ID 1)
      title,
      description,
      priority,
      status: 'TODO',
      issue_type: 'TASK',
      assignee: assignee || null // Send ID or null if empty
    });
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0, color: '#172b4d' }}>Create Issue</h2>
        
        <form onSubmit={handleSubmit}>
          {/* TITLE */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Summary <span style={{color:'red'}}>*</span></label>
            <input 
              required
              autoFocus
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              placeholder="What needs to be done?"
            />
          </div>

          {/* DESCRIPTION */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{...inputStyle, height: '80px', fontFamily: 'sans-serif'}}
              placeholder="Add more details..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
             {/* PRIORITY */}
             <div style={{ flex: 1, marginBottom: '16px' }}>
                <label style={labelStyle}>Priority</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  style={inputStyle}
                >
                  <option value="LOW">Low</option>
                  <option value="MED">Medium</option>
                  <option value="HIGH">High</option>
                </select>
             </div>

             {/* ASSIGNEE */}
             <div style={{ flex: 1, marginBottom: '16px' }}>
                <label style={labelStyle}>Assignee</label>
                <select 
                  value={assignee} 
                  onChange={(e) => setAssignee(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
             </div>
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#42526e', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending}
              style={{ background: '#0052cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer' }}
            >
              {mutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline CSS Styles
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(9, 30, 66, 0.54)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  background: 'white',
  padding: '24px',
  borderRadius: '4px',
  width: '400px',
  boxShadow: '0 0 0 1px rgba(9,30,66,0.08), 0 2px 24px rgba(9,30,66,0.08)'
};

const fieldGroupStyle = { marginBottom: '16px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '3px', border: '2px solid #dfe1e6', boxSizing: 'border-box', fontSize: '14px' };