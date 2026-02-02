import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateIssue, fetchUsers, fetchComments, createComment, fetchSubtasks, createSubtask, toggleSubtask, deleteSubtask, deleteIssue } from './api'; // <--- Import deleteIssue

export default function EditIssueModal({ issue, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MED');
  const [assignee, setAssignee] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  // Queries
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: fetchUsers, enabled: !!isOpen });
  const { data: comments = [] } = useQuery({ queryKey: ['comments', issue?.id], queryFn: () => fetchComments(issue.id), enabled: !!isOpen && !!issue });
  const { data: subtasks = [] } = useQuery({ queryKey: ['subtasks', issue?.id], queryFn: () => fetchSubtasks(issue.id), enabled: !!isOpen && !!issue });

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || '');
      setPriority(issue.priority);
      setAssignee(issue.assignee || '');
    }
  }, [issue]);

  // --- MUTATIONS ---
  const updateMutation = useMutation({
    mutationFn: updateIssue,
    onSuccess: () => { queryClient.invalidateQueries(['issues']); onClose(); }
  });

  const commentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => { queryClient.invalidateQueries(['comments', issue.id]); setNewComment(''); }
  });

  const addSubtaskMutation = useMutation({
    mutationFn: createSubtask,
    onSuccess: () => { queryClient.invalidateQueries(['subtasks', issue.id]); queryClient.invalidateQueries(['issues']); setNewSubtask(''); }
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: toggleSubtask,
    onSuccess: () => { queryClient.invalidateQueries(['subtasks', issue.id]); queryClient.invalidateQueries(['issues']); }
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: deleteSubtask,
    onSuccess: () => { queryClient.invalidateQueries(['subtasks', issue.id]); queryClient.invalidateQueries(['issues']); }
  });

  // NEW: Delete Issue Mutation
  const deleteIssueMutation = useMutation({
    mutationFn: deleteIssue,
    onSuccess: () => { 
        queryClient.invalidateQueries(['issues']); // Refresh board
        onClose(); // Close modal
    }
  });

  // --- HANDLERS ---
  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: issue.id, title, description, priority, assignee: assignee || null });
  };

  const handleDelete = () => {
      if (window.confirm("Are you sure you want to delete this issue? This cannot be undone.")) {
          deleteIssueMutation.mutate(issue.id);
      }
  };

  const handleAddSubtask = (e) => {
      e.preventDefault();
      if (!newSubtask.trim()) return;
      addSubtaskMutation.mutate({ issue: issue.id, title: newSubtask, completed: false });
  };

  if (!isOpen || !issue) return null;

  const totalTasks = subtasks.length;
  const completedTasks = subtasks.filter(t => t.completed).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#5e6c84' }}>{issue.key}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
                {/* DELETE BUTTON (Trash Icon) */}
                <button 
                    onClick={handleDelete}
                    title="Delete Issue"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                >
                    🗑️
                </button>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
        </div>
        
        <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '10px' }}>
            {/* FORM */}
            <form id="edit-form" onSubmit={handleSave}>
                <div style={fieldGroupStyle}>
                    <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{...inputStyle, fontSize: '18px', fontWeight: '500', padding: '8px 0', border: 'none', borderBottom: '2px solid transparent' }} />
                </div>
                <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{...inputStyle, height: '80px', fontFamily: 'sans-serif', resize: 'vertical'}} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Priority</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                            <option value="LOW">Low</option><option value="MED">Medium</option><option value="HIGH">High</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Assignee</label>
                        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={inputStyle}>
                            <option value="">Unassigned</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                        </select>
                    </div>
                </div>
            </form>

            {/* CHECKLIST */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={labelStyle}>Checklist</label>
                    {totalTasks > 0 && <span style={{ fontSize: '11px', color: '#5e6c84' }}>{progressPercent}% done</span>}
                </div>
                {totalTasks > 0 && (
                    <div style={{ height: '6px', background: '#dfe1e6', borderRadius: '3px', marginBottom: '15px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progressPercent}%`, background: '#0052cc', transition: 'width 0.3s ease' }} />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                    {subtasks.map(task => (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', borderRadius: '3px', background: task.completed ? '#f4f5f7' : 'white' }}>
                            <input type="checkbox" checked={task.completed} onChange={(e) => toggleSubtaskMutation.mutate({ id: task.id, completed: e.target.checked })} style={{ cursor: 'pointer' }} />
                            <span style={{ flex: 1, fontSize: '14px', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#6b778c' : '#172b4d' }}>{task.title}</span>
                            <button onClick={() => deleteSubtaskMutation.mutate(task.id)} style={{ background: 'none', border: 'none', color: '#6b778c', cursor: 'pointer', fontSize: '16px' }}>×</button>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Add an item..." style={{ ...inputStyle, padding: '6px 8px' }} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(e)} />
                    <button onClick={handleAddSubtask} disabled={!newSubtask.trim()} style={{ background: '#f4f5f7', border: 'none', padding: '6px 12px', borderRadius: '3px', color: '#172b4d', fontWeight: '500', cursor: 'pointer' }}>Add</button>
                </div>
            </div>

            {/* ACTIVITY */}
            <div style={{ borderTop: '1px solid #dfe1e6', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '14px', color: '#172b4d', margin: '0 0 15px 0' }}>Activity</h4>
                <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commentMutation.mutate({ issue: issue.id, text: newComment })} placeholder="Add a comment..." style={inputStyle} />
            </div>
        </div>

        {/* FOOTER */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #dfe1e6', paddingTop: '15px' }}>
            <button type="submit" form="edit-form" disabled={updateMutation.isPending} style={{ background: '#0052cc', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '3px', cursor: 'pointer' }}>
              Save
            </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', padding: '30px', borderRadius: '4px', width: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 0 0 1px rgba(9,30,66,0.08), 0 2px 24px rgba(9,30,66,0.08)' };
const fieldGroupStyle = { marginBottom: '20px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '3px', border: '1px solid #dfe1e6', boxSizing: 'border-box', fontSize: '14px' };