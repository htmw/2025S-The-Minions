import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const auth = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    googleLogin: () => window.location.href = `${API_URL}/auth/google`,
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
    getCurrentUser: () => api.get('/auth/me')
};

// Patient endpoints
export const patients = {
    getAll: (params) => api.get('/patients', { params }),
    getById: (id) => api.get(`/patients/${id}`),
    create: (data) => api.post('/patients', data),
    update: (id, data) => api.patch(`/patients/${id}`, data),
    delete: (id) => api.delete(`/patients/${id}`),
    addMedicalHistory: (id, data) => api.post(`/patients/${id}/medical-history`, data),
    addNote: (id, data) => api.post(`/patients/${id}/notes`, data),
    assignDoctor: (id, doctorId) => api.post(`/patients/${id}/assign-doctor`, { doctorId })
};

// Scan endpoints
export const scans = {
    getAll: (params) => api.get('/scans', { params }),
    getById: (id) => api.get(`/scans/${id}`),
    upload: (data) => {
        const formData = new FormData();
        formData.append('scan', data.scan);
        formData.append('patientId', data.patientId);
        return api.post('/scans', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    update: (id, data) => api.patch(`/scans/${id}`, data),
    delete: (id) => api.delete(`/scans/${id}`),
    addAnnotation: (id, data) => api.post(`/scans/${id}/annotate`, data),
    generateReport: (id) => api.post(`/scans/${id}/report`),
    getStatistics: () => api.get('/scans/statistics')
};

// ML Model endpoints
export const mlModel = {
    analyzeScan: (scanId) => api.post('/ml/analyze', { scanId }),
    getAnalysisStatus: (jobId) => api.get(`/ml/status/${jobId}`),
    getAnalysisResults: (scanId) => api.get(`/ml/results/${scanId}`)
};

export default api;