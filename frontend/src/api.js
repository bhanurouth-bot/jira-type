import axios from 'axios';

// Base configuration
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
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
  // Use the full URL to override the baseURL setting
  await api.get('http://127.0.0.1:8000/api/logout/');
};

export const fetchIssues = async () => {
  const { data } = await api.get('issues/');
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

export const deleteAttachment = async (id) => {
  let csrfToken = null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) csrfToken = match[1];
  
  await api.delete(`attachments/${id}/`, {
    headers: { 'X-CSRFToken': csrfToken }
  });
};

export default api;