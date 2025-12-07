import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { FaGoogle } from 'react-icons/fa';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      // 로그인 성공 시 대시보드로 이동
      navigate('/dashboard');
    } catch (error) {
      console.error('로그인 에러:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
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
    </div>
  );
};

export default Login;

