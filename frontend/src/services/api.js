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

export const getAnalyticsOverview = async () => {
    const response = await api.get('/api/analytics/overview');
    return response.data;
};

export const getAnalyticsTrends = async (days = 7) => {
    const response = await api.get(`/api/analytics/trends?days=${days}`);
    return response.data;
};

export const analyzeRepo = async (repoUrl, branch = null) => {
    const response = await api.post('/api/git/analyze', { repo_url: repoUrl, branch });
    return response.data;
};

export const estimateRepo = async (repoUrl) => {
    const response = await api.post('/api/git/estimate', { repo_url: repoUrl });
    return response.data;
};

export const deleteBlock = async (blockId) => {
    await api.delete(`/api/blocks/${blockId}`);
    return { success: true };
};

export const batchDeleteBlocks = async (blockIds) => {
    const response = await api.post('/api/blocks/batch-delete', { block_ids: blockIds });
    return response.data;
};

export const getTopFiles = async () => {
    const response = await api.get('/api/analytics/top-files');
    return response.data;
};

export const searchBlocks = async (params) => {
    // params: { q, languages, min_confidence, page, per_page }
    const response = await api.get('/api/search', {
        params,
        paramsSerializer: params => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return;

                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, v));
                } else {
                    searchParams.append(key, value);
                }
            });
            return searchParams.toString();
        }
    });
    return response.data;
};

export const getLanguages = async () => {
    const response = await api.get('/api/analytics/languages');
    return response.data;
};

export const getFileContent = async (fileId) => {
    const response = await api.get(`/api/files/${fileId}/content`);
    return response.data;
};

export const updateBlock = async (blockId, content, language) => {
    const response = await api.put(`/api/blocks/${blockId}`, { content, language });
    return response.data;
};

export const resetSystem = async () => {
    await api.delete('/api/system/reset');
    return { success: true };
};

export const fetchUserRepos = async (username) => {
    const response = await api.get(`/api/git/users/${username}/repos`);
    return response.data;
};

export const getBatchStatus = async (batchId) => {
    const response = await api.get(`/api/batch/${batchId}/status`);
    return response.data;
};

export default api;
