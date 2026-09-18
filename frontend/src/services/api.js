import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  return 'https://kirana-backend-mb03.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kirana_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      // localStorage.removeItem('kirana_token');
      // localStorage.removeItem('kirana_user');
    }
    return Promise.reject(error);
  }
);

export const getBackendOrigin = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  return 'https://kirana-backend-mb03.onrender.com';
};

export const getImageUrl = (imageSrc, fallback) => {
  if (!imageSrc || typeof imageSrc !== 'string' || !imageSrc.trim()) {
    return fallback || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=60';
  }
  const cleanSrc = imageSrc.trim();
  if (cleanSrc.startsWith('http://') || cleanSrc.startsWith('https://') || cleanSrc.startsWith('data:')) {
    return cleanSrc;
  }
  if (cleanSrc.startsWith('/uploads')) {
    return `${getBackendOrigin()}${cleanSrc}`;
  }
  if (cleanSrc.startsWith('uploads/')) {
    return `${getBackendOrigin()}/${cleanSrc}`;
  }
  return cleanSrc;
};

export default api;
