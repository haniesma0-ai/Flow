import axios, { type AxiosResponse } from 'axios';

export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  has_more: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta | null;
}

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
      const pagination =
        'pagination' in response.data && response.data.pagination
          ? (response.data.pagination as PaginationMeta)
          : null;

      response.data = response.data.data;

      if (pagination) {
        (response as AxiosResponse & { pagination?: PaginationMeta }).pagination = pagination;
      }
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
