import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchComments, createComment } from './api';
import Avatar from './Avatar'; // <--- Import it

export default function CommentsModal({ issue, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', issue?.id],
    queryFn: () => fetchComments(issue.id),
    enabled: !!isOpen && !!issue,
  });

  const mutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', issue.id]);
      setNewComment('');
    },
    onError: () => alert("Failed to post comment")
  });

  const handlePost = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if(!newComment.trim()) return;
        mutation.mutate({
            issue: issue.id,
            text: newComment
        });
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #dfe1e6', paddingBottom: '15px' }}>
            <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#5e6c84', display: 'block' }}>{issue.key}</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>Discussion</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#42526e' }}>✕</button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
            {comments.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b778c', marginTop: '40px', fontStyle: 'italic' }}>
                    No comments yet. Start the conversation!
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {comments.map((comment) => (
                        <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                            {/* USE AVATAR HERE */}
                            <Avatar name={comment.author?.username} size={32} />
                            
                            <div style={{flex: 1}}>
                                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '700', color: '#172b4d', marginRight: '8px' }}>
                                        {comment.author?.username}
                                    </span>
                                    <span style={{ color: '#6b778c', fontSize: '11px' }}>
                                        {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div style={{ background: '#f4f5f7', padding: '8px 12px', borderRadius: '0 8px 8px 8px', color: '#172b4d', fontSize: '14px', lineHeight: '1.4' }}>
                                    {comment.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Input Area */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid #dfe1e6', paddingTop: '15px' }}>
            {/* Show "My" Avatar in Input */}
            <Avatar name="Me" size={32} />
            
            <input 
                autoFocus
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handlePost}
                placeholder="Write a comment..."
                disabled={mutation.isPending}
                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '2px solid #dfe1e6', fontSize: '14px', outline: 'none' }}
            />
            <button 
                onClick={() => handlePost({ key: 'Enter', preventDefault: () => {} })}
                disabled={!newComment.trim() || mutation.isPending}
                style={{ background: '#0052cc', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
            >
                Send
            </button>
        </div>
      </div>
    </div>
  );
}

// Styles
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', padding: '20px', borderRadius: '4px', width: '500px', height: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' };