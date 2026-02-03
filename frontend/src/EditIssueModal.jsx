import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; // <--- Added useQuery
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';
import { updateIssue, uploadAttachment, fetchIssues } from './api'; // <--- Ensure fetchIssues is imported if used, strictly we fetch one issue here
import api from './api'; // We need raw api for fetching single issue
import Avatar from './Avatar';

// Helper to fetch a single issue
const fetchSingleIssue = async (id) => {
    const { data } = await api.get(`issues/${id}/`);
    return data;
};

export default function EditIssueModal({ issue: initialIssue, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 1. LIVE DATA FETCH: Don't rely on the prop. Fetch the latest data.
  const { data: issue } = useQuery({
    queryKey: ['issue', initialIssue?.id],
    queryFn: () => fetchSingleIssue(initialIssue.id),
    enabled: !!initialIssue?.id && isOpen, // Only fetch if modal is open
    initialData: initialIssue // Show the old data instantly while loading new data
  });

  // Sync state when the LIVE issue updates
  useEffect(() => {
    if (issue) {
        // Only update description if user is NOT currently editing it
        if (!isEditingDesc) setDescription(issue.description || '');
        setStatus(issue.status);
    }
  }, [issue, isEditingDesc]);

  const mutation = useMutation({
    mutationFn: updateIssue,
    onSuccess: () => {
      queryClient.invalidateQueries(['issues']); // Update board
      queryClient.invalidateQueries(['issue', issue.id]); // Update this modal
      setIsEditingDesc(false);
    }
  });

  // 2. MULTI-FILE UPLOAD LOGIC
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files); // Convert FileList to Array
    if (files.length === 0) return;

    setIsUploading(true);
    try {
        // Upload all files in parallel
        await Promise.all(files.map(file => uploadAttachment(issue.id, file)));
        
        // Refresh data immediately
        queryClient.invalidateQueries(['issue', issue.id]); 
        queryClient.invalidateQueries(['issues']);
    } catch (error) {
        alert("Failed to upload one or more files");
        console.error(error);
    } finally {
        setIsUploading(false);
        e.target.value = null; // Reset input so you can upload same file again if needed
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
                                <div style={{ padding: '5px', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    View File
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* 3. MULTIPLE ATTRIBUTE ADDED HERE */}
                    <label style={{ ...secondaryBtn, display: 'inline-block', cursor: 'pointer' }}>
                        {isUploading ? "Uploading..." : "➕ Add Attachments"}
                        <input 
                            type="file" 
                            multiple // <--- ALLOWS MULTIPLE FILES
                            onChange={handleFileUpload} 
                            style={{ display: 'none' }} 
                            disabled={isUploading} 
                        />
                    </label>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ flex: 1 }}>
                <div style={detailBox}>
                    <label style={labelStyle}>Status</label>
                    <select value={status} onChange={(e) => handleStatusChange(e.target.value)} style={selectStyle}>
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>

                <div style={detailBox}>
                    <label style={labelStyle}>Assignee</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0' }}>
                        <Avatar src={issue.assignee_details?.avatar} name={issue.assignee_details?.username} size={32} />
                        <span style={{ color: '#172b4d', fontWeight: '500' }}>{issue.assignee_details?.username || "Unassigned"}</span>
                    </div>
                </div>

                <div style={detailBox}>
                    <label style={labelStyle}>Priority</label>
                    <div style={{ padding: '5px 0', color: '#172b4d' }}>{issue.priority}</div>
                </div>
                
                <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '20px' }}>
                    Created {new Date(issue.created_at).toLocaleDateString()}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// Styles (No changes here)
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', padding: '40px', borderRadius: '4px', width: '900px', height: '80vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' };
const sectionTitle = { fontSize: '16px', color: '#172b4d', marginBottom: '10px', fontWeight: '600' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#5e6c84', marginBottom: '5px', textTransform: 'uppercase' };
const detailBox = { marginBottom: '20px' };
const selectStyle = { padding: '8px', width: '100%', borderRadius: '3px', border: '1px solid #dfe1e6', background: '#f4f5f7', fontWeight: '600', color: '#172b4d' };
const primaryBtn = { background: '#0052cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer', fontWeight: '600' };
const secondaryBtn = { background: 'rgba(9, 30, 66, 0.04)', color: '#42526e', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer', fontWeight: '600' };
const fileCardStyle = { width: '100px', border: '1px solid #dfe1e6', borderRadius: '3px', textDecoration: 'none', color: '#172b4d', display: 'block' };