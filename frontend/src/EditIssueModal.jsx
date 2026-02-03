import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; 
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';
// 1. IMPORT YOUR SPECIFIC FUNCTIONS
import { updateIssue, uploadAttachment, deleteIssue, createSubtask, toggleSubtask, deleteSubtask } from './api'; 
import api from './api'; 
import Avatar from './Avatar';

const fetchSingleIssue = async (id) => {
    const { data } = await api.get(`issues/${id}/`);
    return data;
};

export default function EditIssueModal({ issue: initialIssue, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [newSubtask, setNewSubtask] = useState(''); // State for input
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: issue } = useQuery({
    queryKey: ['issue', initialIssue?.id],
    queryFn: () => fetchSingleIssue(initialIssue.id),
    enabled: !!initialIssue?.id && isOpen, 
    initialData: initialIssue 
  });

  useEffect(() => {
    if (issue) {
        if (!isEditingDesc) setDescription(issue.description || '');
        setStatus(issue.status);
    }
  }, [issue, isEditingDesc]);

  const mutation = useMutation({
    mutationFn: updateIssue,
    onSuccess: () => {
      queryClient.invalidateQueries(['issues']); 
      queryClient.invalidateQueries(['issue', issue.id]); 
      setIsEditingDesc(false);
    }
  });

  const deleteMutation = useMutation({
      mutationFn: deleteIssue,
      onSuccess: () => {
          queryClient.invalidateQueries(['issues']);
          onClose(); 
      }
  });

  // --- SUBTASK HANDLERS (Matched to your api.js) ---

  const handleAddSubtask = async (e) => {
      e.preventDefault();
      if (!newSubtask.trim()) return;

      try {
          // You defined createSubtask(data), so we pass an object
          await createSubtask({ 
              issue: issue.id, 
              title: newSubtask 
          });
          setNewSubtask('');
          queryClient.invalidateQueries(['issue', issue.id]);
      } catch (error) {
          console.error("Failed to add subtask", error);
      }
  };

  const handleToggleSubtask = async (subtask) => {
      try {
          // You defined toggleSubtask({ id, completed })
          await toggleSubtask({ 
              id: subtask.id, 
              completed: !subtask.completed 
          });
          queryClient.invalidateQueries(['issue', issue.id]);
      } catch (error) {
          console.error("Failed to toggle subtask", error);
      }
  };

  const handleDeleteSubtask = async (subtaskId) => {
      try {
          await deleteSubtask(subtaskId);
          queryClient.invalidateQueries(['issue', issue.id]);
      } catch (error) {
          console.error("Failed to delete subtask", error);
      }
  };

  // Calculate Progress
  const completedCount = issue?.subtasks?.filter(s => s.completed).length || 0;
  const totalCount = issue?.subtasks?.length || 0;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleDelete = () => {
      if (window.confirm("Are you sure you want to delete this issue? This cannot be undone.")) {
          deleteMutation.mutate(issue.id);
      }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files); 
    if (files.length === 0) return;

    setIsUploading(true);
    try {
        await Promise.all(files.map(file => uploadAttachment(issue.id, file)));
        queryClient.invalidateQueries(['issue', issue.id]); 
        queryClient.invalidateQueries(['issues']);
    } catch (error) {
        alert("Failed to upload files");
    } finally {
        setIsUploading(false);
        e.target.value = null; 
    }
  };

  const handleSaveDescription = () => {
    mutation.mutate({ id: issue.id, description });
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    mutation.mutate({ id: issue.id, status: newStatus });
  };

  if (!isOpen || !issue) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
             <div>
                 <span style={{ fontSize: '14px', color: '#5e6c84' }}>{issue.key}</span>
                 <h2 style={{ margin: '5px 0 0 0', color: '#172b4d', fontSize: '24px' }}>{issue.title}</h2>
             </div>
             <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '40px' }}>
            {/* LEFT COLUMN */}
            <div style={{ flex: 2 }}>
                
                {/* Description */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={sectionTitle}>Description</h3>
                    {isEditingDesc ? (
                        <div style={{ marginBottom: '60px' }}> 
                             <ReactQuill 
                                theme="snow"
                                value={description} 
                                onChange={setDescription} 
                                style={{ height: '200px' }}
                             />
                             <div style={{ marginTop: '50px', display: 'flex', gap: '10px' }}>
                                 <button onClick={handleSaveDescription} style={primaryBtn}>Save</button>
                                 <button onClick={() => setIsEditingDesc(false)} style={secondaryBtn}>Cancel</button>
                             </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => setIsEditingDesc(true)}
                            style={{ minHeight: '60px', padding: '10px', border: '1px solid transparent', borderRadius: '3px', cursor: 'text', backgroundColor: description ? 'transparent' : '#f4f5f7' }}
                            onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #dfe1e6'}
                            onMouseLeave={(e) => e.currentTarget.style.border = '1px solid transparent'}
                        >
                            {description ? (
                                <div dangerouslySetInnerHTML={{ __html: description }} />
                            ) : (
                                <span style={{ color: '#5e6c84', fontStyle: 'italic' }}>Add a description...</span>
                            )}
                        </div>
                    )}
                </div>

                {/* --- SUBTASKS SECTION --- */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={sectionTitle}>Subtasks</h3>
                    
                    {/* Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#dfe1e6', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#36b37e' : '#0052cc', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#5e6c84', fontWeight: '600' }}>{progress}% Done</span>
                    </div>

                    {/* Subtask List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {issue.subtasks?.map(subtask => (
                            <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={subtask.completed} 
                                    onChange={() => handleToggleSubtask(subtask)}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }} 
                                />
                                <span style={{ 
                                    textDecoration: subtask.completed ? 'line-through' : 'none', 
                                    color: subtask.completed ? '#6b778c' : '#172b4d',
                                    flex: 1 
                                }}>
                                    {subtask.title}
                                </span>
                                <button 
                                    onClick={() => handleDeleteSubtask(subtask.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b778c', opacity: 0.6 }}
                                    onMouseEnter={(e) => e.target.style.opacity = 1}
                                    onMouseLeave={(e) => e.target.style.opacity = 0.6}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Subtask Input */}
                    <form onSubmit={handleAddSubtask} style={{ marginTop: '10px' }}>
                        <input 
                            type="text" 
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            placeholder="What needs to be done?"
                            style={{ width: '100%', padding: '8px', borderRadius: '3px', border: '1px solid #dfe1e6', fontSize: '13px' }}
                        />
                    </form>
                </div>

                {/* Attachments Section */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={sectionTitle}>Attachments</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                        {issue.attachments?.map(file => (
                            <a key={file.id} href={file.file} target="_blank" rel="noreferrer" style={fileCardStyle}>
                                {file.file.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    <img src={file.file} alt="attachment" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '3px 3px 0 0' }} />
                                ) : (
                                    <div style={{ height: '80px', background: '#dfe1e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', borderRadius: '3px 3px 0 0' }}>📄</div>
                                )}
                                <div style={{ padding: '5px', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>View File</div>
                            </a>
                        ))}
                    </div>
                    <label style={{ ...secondaryBtn, display: 'inline-block', cursor: 'pointer' }}>
                        {isUploading ? "Uploading..." : "➕ Add Attachments"}
                        <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
                    </label>
                </div>

                {/* Activity History */}
                <div style={{ marginTop: '40px', borderTop: '1px solid #dfe1e6', paddingTop: '20px' }}>
                    <h3 style={sectionTitle}>Activity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {issue.history?.length === 0 && <div style={{ color: '#5e6c84', fontStyle: 'italic' }}>No history yet.</div>}
                        {issue.history?.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                                <Avatar src={item.actor_avatar} name={item.actor_name} size={24} />
                                <div style={{ color: '#172b4d' }}>
                                    <span style={{ fontWeight: '600' }}>{item.actor_name}</span> changed <span style={{ fontWeight: '600' }}>{item.field}</span> from <span style={{ background: '#dfe1e6', padding: '0 4px', borderRadius: '3px' }}>{item.old_value}</span> to <span style={{ background: '#deebff', padding: '0 4px', borderRadius: '3px' }}>{item.new_value}</span>
                                </div>
                                <div style={{ marginLeft: 'auto', color: '#5e6c84', fontSize: '11px' }}>{new Date(item.timestamp).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Status (Editable) */}
                <div>
                    <label style={labelStyle}>Status</label>
                    <select value={status} onChange={(e) => handleStatusChange(e.target.value)} style={selectStyle}>
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>

                {/* Assignee (Read-Only) */}
                <div>
                    <label style={labelStyle}>Assignee</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
                        <Avatar src={issue.assignee_details?.avatar} name={issue.assignee_details?.username} size={32} />
                        <span style={{ color: '#172b4d', fontWeight: '500' }}>{issue.assignee_details?.username || "Unassigned"}</span>
                    </div>
                </div>

                {/* Priority (Read-Only) */}
                <div>
                    <label style={labelStyle}>Priority</label>
                    <div style={{ padding: '5px 0', color: '#172b4d', fontWeight: '500' }}>{issue.priority}</div>
                </div>
                
                {/* Meta Info */}
                <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '10px' }}>
                    Created {new Date(issue.created_at).toLocaleDateString()}
                </div>

                {/* Delete Button (Active) */}
                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #dfe1e6', textAlign: 'right' }}>
                    <button 
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        style={{ background: 'none', border: 'none', color: '#de350b', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                    >
                        {deleteMutation.isPending ? "Deleting..." : "🗑 Delete Issue"}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// Styles (unchanged)
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', padding: '40px', borderRadius: '4px', width: '900px', height: '80vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' };
const sectionTitle = { fontSize: '16px', color: '#172b4d', marginBottom: '10px', fontWeight: '600' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#5e6c84', marginBottom: '5px', textTransform: 'uppercase' };
const selectStyle = { padding: '8px', width: '100%', borderRadius: '3px', border: '1px solid #dfe1e6', background: '#f4f5f7', fontWeight: '600', color: '#172b4d' };
const primaryBtn = { background: '#0052cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer', fontWeight: '600' };
const secondaryBtn = { background: 'rgba(9, 30, 66, 0.04)', color: '#42526e', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer', fontWeight: '600' };
const fileCardStyle = { width: '100px', border: '1px solid #dfe1e6', borderRadius: '3px', textDecoration: 'none', color: '#172b4d', display: 'block' };