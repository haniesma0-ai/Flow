import axios from 'axios';

// Créer une instance axios avec la configuration de base
const api = axios.create({
    baseURL: '/api', // URL de base pour les appels API
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expiré ou invalide
            localStorage.removeItem('token');
            // Rediriger vers la page de connexion si nécessaire
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
