import axios from 'axios';
import { getToken, clearAuth } from './auth';
import { API_BASE_URL } from './utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
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
    // 네트워크 에러 처리
    if (!error.response) {
      console.error('네트워크 에러:', error.message);
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

// 북마크 토글
export const toggleBookmark = async (pdfId, pageNumber) => {
  const response = await api.put('/api/pdf/bookmark', {
    pdfId,
    pageNumber,
  });
  return response.data;
};

export default api;

