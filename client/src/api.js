import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// PDF 업로드
export const uploadPDF = async (formData) => {
  const response = await api.post('/api/pdf/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 특정 유저의 PDF 목록 조회
export const fetchPDFs = async (userId) => {
  const response = await api.get(`/api/pdf/list/${userId}`);
  return response.data;
};

// 진행률 업데이트
export const updateProgress = async (pdfId, currentPage, progress) => {
  const response = await api.put('/api/pdf/progress', {
    pdfId,
    currentPage,
    progress,
  });
  return response.data;
};

export default api;

