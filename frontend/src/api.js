import axios from 'axios';

// Base configuration
const api = axios.create({
  baseURL: 'http://100.111.91.125:8000/api/',
  withCredentials: true, // <--- THIS IS CRITICAL. It sends the session cookie.
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchUsers = async () => {
  const { data } = await api.get('users/');
  return data;
};

export const logoutUser = async () => {
  // CORRECT: This goes to /api/auth/logout/
  await api.get('auth/logout/'); 
};

// PROJECTS
export const fetchProjects = async () => {
  const { data } = await api.get('projects/');
  return data;
};

export const createProject = async (name) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  const { data } = await api.post('projects/', { name, key: name.substring(0,3).toUpperCase() }, {
    headers: { 'X-CSRFToken': csrfToken }
  });
  return data;
};

// ISSUES (Update this existing function)
export const fetchIssues = async (projectId) => {
  // If projectId is provided, filter. Otherwise get all.
  const url = projectId ? `issues/?project=${projectId}` : 'issues/';
  const { data } = await api.get(url);
  return data;
};

export const registerUser = async (username, password, email) => {
  const { data } = await api.post('auth/register/', { username, password, email });
  return data;
};

export const createIssue = async (issueData) => {
  // 1. Get the token (Reuse your working logic)
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  // 2. Send POST request
  const { data } = await api.post('issues/', issueData, {
      headers: { 
        'X-CSRFToken': csrfToken 
      }
  });
  return data;
};

export const fetchComments = async (issueId) => {
  const { data } = await api.get(`comments/?issue=${issueId}`);
  return data;
};

// Post a new comment
export const createComment = async ({ issue, text }) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  const { data } = await api.post('comments/', { issue, text }, {
      headers: { 'X-CSRFToken': csrfToken }
  });
  return data;
};

export const updateIssue = async ({ id, ...data }) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  const { data: response } = await api.patch(`issues/${id}/`, data, {
      headers: { 'X-CSRFToken': csrfToken }
  });
  return response;
};

export const updateIssueStatus = async ({ id, status }) => {
  // Try to find the cookie
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) {
    csrfToken = match[1];
  } else {
    console.warn("CSRF Token not found in cookies!");
  }
  
  const { data } = await api.patch(`issues/${id}/`, { status }, {
      headers: { 
        'X-CSRFToken': csrfToken 
      }
  });
  return data;
};

export const deleteIssue = async (id) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  await api.delete(`issues/${id}/`, {
    headers: { 'X-CSRFToken': csrfToken }
  });
};

// --- SUBTASKS ---

export const fetchSubtasks = async (issueId) => {
  const { data } = await api.get(`subtasks/?issue=${issueId}`);
  return data;
};

export const loginUser = async (username, password) => {
  // CORRECT
  const { data } = await api.post('auth/login/', { username, password });
  return data;
};

export const createSubtask = async (data) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  const { data: response } = await api.post('subtasks/', data, {
    headers: { 'X-CSRFToken': csrfToken }
  });
  return response;
};

export const toggleSubtask = async ({ id, completed }) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  const { data } = await api.patch(`subtasks/${id}/`, { completed }, {
    headers: { 'X-CSRFToken': csrfToken }
  });
  return data;
};

export const deleteSubtask = async (id) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];
  
  await api.delete(`subtasks/${id}/`, {
    headers: { 'X-CSRFToken': csrfToken }
  });
};

export const updateIssueOrder = async (issues) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  // We send a list of { id, order } pairs
  const formattedUpdates = issues.map((issue, index) => ({
    id: issue.id,
    order: index // The array index becomes the new order
  }));

  await api.post('issues/bulk_update_order/', { issues: formattedUpdates }, {
      headers: { 'X-CSRFToken': csrfToken }
  });
};

// --- ATTACHMENTS ---

export const fetchAttachments = async (issueId) => {
  const { data } = await api.get(`attachments/?issue=${issueId}`);
  return data;
};

export const uploadAttachment = async ({ issueId, file }) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  // We must use FormData for file uploads
  const formData = new FormData();
  formData.append('issue', issueId);
  formData.append('file', file);

  const { data } = await api.post('attachments/', formData, {
    headers: { 
        'X-CSRFToken': csrfToken,
        'Content-Type': 'multipart/form-data' // Important!
    }
  });
  return data;
};

export const addProjectMember = async (projectId, username) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  const { data } = await api.post(`projects/${projectId}/add_member/`, { username }, {
    headers: { 'X-CSRFToken': csrfToken }
  });
  return data;
};
// --- USER PROFILE ---

export const fetchCurrentUser = async () => {
  const { data } = await api.get('users/me/');
  return data;
};

export const updateCurrentUser = async (userData) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];

  // Convert object to FormData to handle images
  const formData = new FormData();
  if (userData.first_name) formData.append('first_name', userData.first_name);
  if (userData.last_name) formData.append('last_name', userData.last_name);
  if (userData.email) formData.append('email', userData.email);
  if (userData.avatar) formData.append('avatar', userData.avatar); // <--- The File

  const { data } = await api.patch('users/me/', formData, {
    headers: { 
        'X-CSRFToken': csrfToken,
        'Content-Type': 'multipart/form-data' // <--- Critical
    }
  });
  return data;
};

export const deleteAttachment = async (id) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];
  
  await api.delete(`attachments/${id}/`, {
    headers: { 'X-CSRFToken': csrfToken }
  });
};

export default api;