import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost/fox_petroleum/public/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ➜ Ajout automatique du token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ➜ Auto-unwrap { success, data } envelope from backend
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    // On 401, token is expired/invalid — clear auth and redirect to login
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Avoid redirect loop on login page
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
