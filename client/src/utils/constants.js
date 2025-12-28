/**
 * 애플리케이션 상수
 */

// API 관련
// 환경 변수에서 URL을 가져오되, 끝의 슬래시는 제거
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// 파일 관련
export const PDF_MIME_TYPE = 'application/pdf';
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// 업데이트 관련
export const PROGRESS_UPDATE_INTERVAL = 1000; // 1초
export const PROGRESS_UPDATE_THRESHOLD = 1; // 1% 이상 변화 시 업데이트

// 페이지 관련
export const DEFAULT_PAGE_WIDTH = 800;
export const PAGE_PADDING = 64;

