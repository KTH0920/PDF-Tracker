/**
 * 서버 사이드 유효성 검사 유틸리티
 */

/**
 * MongoDB ObjectId 유효성 검사
 * @param {string} id - 검사할 ID
 * @returns {boolean} - 유효성 여부
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * 진행률 값 유효성 검사 (0-100)
 * @param {number} progress - 검사할 진행률
 * @returns {boolean} - 유효성 여부
 */
export const isValidProgress = (progress) => {
  return typeof progress === 'number' && progress >= 0 && progress <= 100;
};

/**
 * 페이지 번호 유효성 검사 (1 이상의 정수)
 * @param {number} page - 검사할 페이지 번호
 * @returns {boolean} - 유효성 여부
 */
export const isValidPageNumber = (page) => {
  return typeof page === 'number' && page >= 1 && Number.isInteger(page);
};

