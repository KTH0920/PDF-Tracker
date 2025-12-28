/**
 * 환경 변수 검증 및 로딩 유틸리티
 */

/**
 * 필수 환경 변수 검증
 * @param {string[]} requiredVars - 필수 환경 변수 목록
 * @throws {Error} - 필수 환경 변수가 없을 경우
 */
export const validateEnvVars = (requiredVars = []) => {
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `필수 환경 변수가 설정되지 않았습니다: ${missing.join(', ')}\n` +
      '.env 파일을 확인해주세요.'
    );
  }
};

