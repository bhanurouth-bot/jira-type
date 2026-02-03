import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { createIssue, fetchUsers } from './api';
import Avatar from './Avatar';

export default function CreateIssueModal({ isOpen, onClose, projectId }) {
  const queryClient = useQueryClient();
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // ReactQuill uses this
  const [priority, setPriority] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState('');

  // Fetch Users for the dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isOpen
  });

  const mutation = useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      queryClient.invalidateQueries(['issues', projectId]);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setAssigneeId('');
    },
    onError: () => alert("Failed to create issue")
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    
    mutation.mutate({
      project: projectId,
      title,
      description, // This now contains HTML (e.g., <p><b>Bold</b></p>)
      priority,
      assignee_id: assigneeId || null
    });
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <h2 style={{ margin: 0, color: '#172b4d' }}>Create Issue</h2>
             <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Title */}
            <div>
                <label style={labelStyle}>Issue Title <span style={{color:'red'}}>*</span></label>
                <input 
                    autoFocus
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                    placeholder="What needs to be done?"
                />
            </div>

            {/* Rich Text Description */}
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '50px' }}>
                <label style={labelStyle}>Description</label>
                <ReactQuill 
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    style={{ height: '150px' }} // Keep this on the editor itself
                />
            </div>

            {/* Row: Priority & Assignee */}
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>

                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Assignee</label>
                    <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={inputStyle}>
                        <option value="">Unassigned</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '3px', border: 'none', background: 'none', color: '#42526e', cursor: 'pointer' }}>Cancel</button>
                <button 
                    type="submit" 
                    disabled={mutation.isPending}
                    style={{ padding: '8px 16px', borderRadius: '3px', border: 'none', background: '#0052cc', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    {mutation.isPending ? 'Creating...' : 'Create Issue'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', padding: '30px', borderRadius: '4px', width: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '3px', border: '2px solid #dfe1e6', fontSize: '14px', boxSizing: 'border-box' };