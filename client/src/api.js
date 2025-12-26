import axios from 'axios';
import { getToken, clearAuth } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 추가
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 토큰 만료 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// PDF 업로드
export const uploadPDF = async (formData) => {
  const response = await api.post('/api/pdf/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 특정 유저의 PDF 목록 조회 (인증된 사용자의 목록)
export const fetchPDFs = async () => {
  const response = await api.get('/api/pdf/list');
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

// PDF 삭제
export const deletePDF = async (pdfId) => {
  const response = await api.delete(`/api/pdf/${pdfId}`);
  return response.data;
};

export default api;

