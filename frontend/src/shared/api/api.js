import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
    try {
        const saved = localStorage.getItem('user');
        if (saved) {
            const user = JSON.parse(saved);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
    } catch {
        /* malformed stored session */
    }
    return config;
});

export default api;
