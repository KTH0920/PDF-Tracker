import { useEffect, useState } from 'react';
import { FaCheckCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // 애니메이션 시간과 동일
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: 'text-green-500 dark:text-green-400',
      iconComponent: FaCheckCircle,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'text-blue-500 dark:text-blue-400',
      iconComponent: FaInfoCircle,
    },
  };

  const style = typeStyles[type] || typeStyles.success;
  const Icon = style.iconComponent;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
        style.bg
      } ${style.border} ${
        isExiting
          ? 'animate-fade-out translate-x-full opacity-0'
          : 'animate-fade-in translate-x-0 opacity-100'
      } transition-all duration-300 ease-in-out min-w-[300px] max-w-md`}
    >
      <Icon className={`text-xl ${style.icon} flex-shrink-0`} />
      <p className={`flex-1 font-medium ${style.text}`}>{message}</p>
      <button
        onClick={handleClose}
        className={`flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${style.text}`}
        aria-label="닫기"
      >
        <FaTimes className="text-sm" />
      </button>
    </div>
  );
};

export default Toast;

