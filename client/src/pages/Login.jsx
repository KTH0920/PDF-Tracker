import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuth } from '../auth';
import { FaGoogle } from 'react-icons/fa';
import { API_BASE_URL } from '../utils/constants';
import Toast from '../components/Toast';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const codeClientRef = useRef(null);

  useEffect(() => {
    // Google GSI 스크립트가 로드될 때까지 대기
    const initGoogleSignIn = () => {
      if (window.google?.accounts?.oauth2) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        const redirectUri = window.location.origin;

        codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: 'openid profile email',
          ux_mode: 'popup',
          callback: async (response) => {
            try {
              setLoading(true);
              // Authorization Code를 백엔드로 전송하여 검증 및 JWT 발급
              const fetchResponse = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: response.code })
              });

              if (!fetchResponse.ok) {
                const errorData = await fetchResponse.json().catch(() => ({}));
                const errorMessage = errorData.details || errorData.error || '인증 실패';
                console.error('서버 응답 에러:', {
                  status: fetchResponse.status,
                  statusText: fetchResponse.statusText,
                  errorData
                });
                throw new Error(errorMessage);
              }

              const data = await fetchResponse.json();
              // JWT 토큰과 사용자 정보를 localStorage에 저장
              setAuth(data.token, data.user);
              
              console.log('로그인 성공, 사용자 정보 저장됨:', data.user);
              
              // 성공 팝업 표시
              setShowToast(true);
              
              // 팝업 표시 후 대시보드로 이동
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1500);
            } catch (error) {
              console.error('로그인 에러:', error);
              alert(`로그인에 실패했습니다: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
          error_callback: (error) => {
            // 에러 내용을 콘솔에 로그로 출력
            console.error('Google 로그인 에러:', error);
            // 로딩 상태를 false로 변경하여 버튼이 다시 활성화되도록 수정
            setLoading(false);
          }
        });
      } else {
        // Google GSI 스크립트가 아직 로드되지 않았으면 재시도
        setTimeout(initGoogleSignIn, 100);
      }
    };

    initGoogleSignIn();
  }, []);

  const handleGoogleLogin = () => {
    if (codeClientRef.current) {
      setLoading(true);
      codeClientRef.current.requestCode();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/pdf-icon-256.ico" 
            alt="PDF Focus Tracker Logo" 
            className="h-20 w-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            PDF Focus Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            PDF 학습을 추적하고 관리하세요
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <FaGoogle className="text-xl" />
          {loading ? '로그인 중...' : 'Google로 로그인'}
        </button>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Google 계정으로 간편하게 시작하세요</p>
        </div>
      </div>
      
      {showToast && (
        <Toast
          message="로그인에 성공했습니다!"
          type="success"
          duration={1500}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default Login;

