/**
 * 유효성 검사 유틸리티 함수
 */

/**
 * PDF 파일 유효성 검사
 * @param {File} file - 검사할 파일
 * @returns {{ valid: boolean, error?: string }} - 검사 결과
 */
export const validatePDFFile = (file) => {
  if (!file) {
    return { valid: false, error: '파일이 선택되지 않았습니다.' };
  }

  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'PDF 파일만 업로드 가능합니다.' };
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기는 50MB 이하여야 합니다.' };
  }

  return { valid: true };
};

