/**
 * 날짜 포맷팅 유틸리티 함수
 * @param {string|Date} dateString - 포맷팅할 날짜
 * @returns {string} - 포맷팅된 날짜 문자열
 */
export const formatDate = (dateString) => {
  if (!dateString) return '날짜 없음';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

