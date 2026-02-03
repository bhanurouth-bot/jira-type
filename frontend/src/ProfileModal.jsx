import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, updateCurrentUser } from './api';

export default function ProfileModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null); // Current URL
  const [newAvatar, setNewAvatar] = useState(null); // New file to upload

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: fetchCurrentUser,
    enabled: isOpen,
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setUsername(user.username || '');
      setAvatarUrl(user.avatar || null);
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['me']);
      queryClient.invalidateQueries(['users']); // Updates avatars on the board immediately
      alert("Profile updated!");
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ 
        first_name: firstName, 
        last_name: lastName, 
        email,
        avatar: newAvatar // Send the file
    });
  };

  const handleFileChange = (e) => {
      if (e.target.files[0]) {
          setNewAvatar(e.target.files[0]);
          // Create a fake local URL just for preview
          setAvatarUrl(URL.createObjectURL(e.target.files[0]));
      }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
             <h2 style={{ margin: 0, fontSize: '20px', color: '#172b4d' }}>My Profile</h2>
             <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* AVATAR UPLOAD SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #dfe1e6', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                      <span style={{ fontSize: '24px', color: '#6b778c' }}>{username.charAt(0).toUpperCase()}</span>
                  )}
              </div>
              
              <label style={{ cursor: 'pointer', color: '#0052cc', fontSize: '13px', fontWeight: '500' }}>
                  Change Avatar
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
          </div>

          {/* FORM FIELDS */}
          <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
              </div>
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button 
                type="submit" 
                disabled={mutation.isPending}
                style={{ background: '#0052cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 };
const modalStyle = { background: 'white', padding: '30px', borderRadius: '4px', width: '400px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '3px', border: '1px solid #dfe1e6', boxSizing: 'border-box', fontSize: '14px' };