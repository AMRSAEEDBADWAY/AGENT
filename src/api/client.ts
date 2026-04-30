import axios from 'axios';

// Backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add Authorization header
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const uid = localStorage.getItem('uid');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (uid) {
    config.headers = config.headers || {};
    config.headers['X-User-ID'] = uid;
  }
  return config;
});

export default client;
