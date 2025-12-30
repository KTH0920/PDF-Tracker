import { useEffect } from 'react';
import { FaBookOpen, FaRedo } from 'react-icons/fa';

const ResumeModal = ({ 
  isOpen, 
  onClose, 
  onResume, 
  onRestart,
  title = '학습 재개',
  message,
  progress,
  currentPage
}) => {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleResume = () => {
    onResume();
    onClose();
  };

  const handleRestart = () => {
    onRestart();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />
      
      {/* 모달 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-modal-in">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FaBookOpen className="text-xl text-blue-500 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {title}
            </h3>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            {message}
          </p>
          
          {/* 진행 정보 */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">진행률</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              마지막 위치: {currentPage}페이지
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <FaRedo className="text-sm" />
            처음부터 시작
          </button>
          <button
            onClick={handleResume}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
          >
            <FaBookOpen className="text-sm" />
            마지막 위치에서 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;

