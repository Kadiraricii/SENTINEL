import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const extractBlocks = async (fileId) => {
    const response = await api.post(`/api/extract/${fileId}`);
    return response.data;
};

export const submitFeedback = async (feedbackData) => {
    const response = await api.post('/api/feedback', feedbackData);
    return response.data;
};

export const exportBlocks = async (fileId) => {
    const response = await api.get(`/api/export/${fileId}`, {
        responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hpes_export_${fileId}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
};

export default api;
