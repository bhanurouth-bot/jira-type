import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateIssue, fetchUsers, fetchComments, createComment } from './api'; // <--- Import new functions

export default function EditIssueModal({ issue, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MED');
  const [assignee, setAssignee] = useState('');
  
  // New State for Comments
  const [newComment, setNewComment] = useState('');

  // 1. Fetch Users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: !!isOpen,
  });

  // 2. Fetch Comments (Only when issue is open)
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', issue?.id],
    queryFn: () => fetchComments(issue.id),
    enabled: !!isOpen && !!issue,
  });

  // 3. Populate Form
  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || '');
      setPriority(issue.priority);
      setAssignee(issue.assignee || '');
    }
  }, [issue]);

  const updateMutation = useMutation({
    mutationFn: updateIssue,
    onSuccess: () => {
      queryClient.invalidateQueries(['issues']);
      onClose();
    },
    onError: () => alert("Failed to update issue")
  });

  // Mutation to Add Comment
  const commentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      // Refresh only the comments list
      queryClient.invalidateQueries(['comments', issue.id]);
      setNewComment(''); // Clear input
    },
    onError: () => alert("Failed to post comment")
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: issue.id,
      title,
      description,
      priority,
      assignee: assignee || null,
    });
  };

  const handlePostComment = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Submit on Enter
        e.preventDefault();
        if(!newComment.trim()) return;
        commentMutation.mutate({
            issue: issue.id,
            text: newComment
        });
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#5e6c84' }}>{issue.key}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
        
        {/* Main Content Scrollable Area */}
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
            <form id="edit-form" onSubmit={handleSave}>
            <div style={fieldGroupStyle}>
                <input 
                required
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{...inputStyle, fontSize: '18px', fontWeight: '500', padding: '8px 0', border: 'none', borderBottom: '2px solid transparent' }}
                placeholder="Issue Summary"
                />
            </div>

            <div style={fieldGroupStyle}>
                <label style={labelStyle}>Description</label>
                <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{...inputStyle, height: '100px', fontFamily: 'sans-serif', resize: 'vertical'}}
                placeholder="Add more details..."
                />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, marginBottom: '20px' }}>
                    <label style={labelStyle}>Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                    <option value="LOW">Low</option>
                    <option value="MED">Medium</option>
                    <option value="HIGH">High</option>
                    </select>
                </div>

                <div style={{ flex: 1, marginBottom: '20px' }}>
                    <label style={labelStyle}>Assignee</label>
                    <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={inputStyle}>
                    <option value="">Unassigned</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                    </select>
                </div>
            </div>
            </form>

            {/* --- COMMENTS SECTION --- */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #dfe1e6', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '14px', color: '#172b4d', margin: '0 0 15px 0' }}>Activity</h4>
                
                {/* List of Comments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                    {comments.map((comment) => (
                        <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                            {/* Avatar */}
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dfe1e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#42526e', flexShrink: 0 }}>
                                {comment.author?.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '600', color: '#172b4d', marginRight: '8px' }}>
                                        {comment.author?.username}
                                    </span>
                                    <span style={{ color: '#6b778c' }}>
                                        {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div style={{ fontSize: '14px', color: '#172b4d', lineHeight: '1.4' }}>
                                    {comment.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <div style={{ fontSize: '13px', color: '#6b778c', fontStyle: 'italic' }}>No comments yet.</div>
                    )}
                </div>

                {/* Add Comment Input */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0052cc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', flexShrink: 0 }}>
                         M {/* 'Me' avatar placeholder */}
                    </div>
                    <div style={{ flex: 1 }}>
                        <input 
                            type="text" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={handlePostComment}
                            placeholder="Add a comment..."
                            disabled={commentMutation.isPending}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '3px', border: '1px solid #dfe1e6', fontSize: '14px' }}
                        />
                        <div style={{ fontSize: '11px', color: '#6b778c', marginTop: '4px' }}>
                            Pro tip: press <strong>Enter</strong> to comment
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #dfe1e6', paddingTop: '15px' }}>
            <button 
              type="submit"
              form="edit-form" // Connects to the form ID above
              disabled={updateMutation.isPending}
              style={{ background: '#0052cc', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '3px', cursor: 'pointer' }}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
        </div>
      </div>
    </div>
  );
}

// ... styles
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(9, 30, 66, 0.54)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  background: 'white',
  padding: '30px',
  borderRadius: '4px',
  width: '600px', // Slightly wider for chat
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 0 0 1px rgba(9,30,66,0.08), 0 2px 24px rgba(9,30,66,0.08)'
};

const fieldGroupStyle = { marginBottom: '20px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '3px', border: '1px solid #dfe1e6', boxSizing: 'border-box', fontSize: '14px' };