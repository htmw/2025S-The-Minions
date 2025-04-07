import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: any) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const auth = {
    login: (credentials: { email: string; password: string }) =>
        api.post('/auth/login', credentials),
    register: (userData: { email: string; password: string; name: string; role: string }) =>
        api.post('/auth/register', userData),
    googleLogin: () => {
        window.location.href = 'http://localhost:8080/api/auth/google';
    },
    forgotPassword: (email: string) =>
        api.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
        api.post('/auth/reset-password', { token, password }),
    getCurrentUser: () => api.get('/auth/me')
};

// Scan endpoints
export const scans = {
    upload: async (formData: FormData) => {
        return api.post('/scans', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    getAll: (params?: any) => api.get('/scans', { params }),
    getById: (id: string) => api.get(`/scans/${id}`),
    update: (id: string, data: any) => api.patch(`/scans/${id}`, data),
    delete: (id: string) => api.delete(`/scans/${id}`),
    addAnnotation: (id: string, data: any) => api.post(`/scans/${id}/annotate`, data),
    generateReport: (id: string) => api.post(`/scans/${id}/report`),
    getStatistics: () => api.get('/scans/statistics')
};

interface AnalysisStatus {
    status: string;
    jobStatus?: {
        state: 'waiting' | 'active' | 'completed' | 'failed';
        progress?: number;
        failedReason?: string;
    };
}

interface AnalysisResults {
    predictions: {
        tumor_present: boolean;
        tumor_type: string;
        tumor_grade: string;
        tumor_probability: number;
        class_probabilities: Record<string, number>;
    };
    location: {
        bounding_box: string;
        heatmap: string;
        dimensions: {
            width: number;
            height: number;
            depth: number;
        };
        volume: number;
    };
    confidence_metrics: {
        entropy: number;
        uncertainty_score: number;
        needs_review: boolean;
    };
    metadata: {
        model_version: string;
        processing_time: number;
        image_quality_score: number;
    };
}

// ML Model endpoints
export const mlModel = {
    getAnalysisStatus: (scanId: string) => api.get<AnalysisStatus>(`/scans/${scanId}/status`),
    getAnalysisResults: (scanId: string) => api.get<AnalysisResults>(`/scans/${scanId}`),
    
    // Use Next.js API route as a proxy to Hugging Face
    analyzeChestXray: async (imageFile: File) => {
        try {
            console.log('Sending chest X-ray for analysis through Next.js API route');
            
            const formData = new FormData();
            formData.append('image', imageFile);
            
            // Use relative URL to the Next.js API route
            const response = await axios.post('/api/ml/analyze-chest', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            console.log('Received response from proxy:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error analyzing chest X-ray:', error);
            throw error;
        }
    }
};

export const user = {
    updateSettings: async (settings: {
        name?: string;
        email?: string;
        notifications?: boolean;
        darkMode?: boolean;
    }) => {
        return api.put('/users/settings', settings);
    },

    changePassword: async (data: {
        currentPassword: string;
        newPassword: string;
    }) => {
        return api.put('/users/change-password', data);
    },
};

export default api;