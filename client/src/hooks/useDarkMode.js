import { useState, useEffect, useCallback } from 'react';

const useDarkMode = () => {
  // 초기 상태: HTML의 dark 클래스 존재 여부로 확인
  const getInitialDarkMode = () => {
    if (typeof window === 'undefined') return false;
    
    // HTML에 이미 dark 클래스가 있는지 확인 (가장 정확)
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      return true;
    }
    
    // 로컬 스토리지에서 저장된 테마 설정 불러오기
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      root.classList.add('dark');
      return true;
    }
    if (savedTheme === 'light') {
      root.classList.remove('dark');
      return false;
    }
    
    // 시스템 설정 확인
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
      return true;
    }
    
    return false;
  };

  const [isDark, setIsDark] = useState(getInitialDarkMode);

  // 상태 변경 시 DOM 업데이트
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      // 즉시 DOM 업데이트
      const root = document.documentElement;
      if (newValue) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newValue;
    });
  }, []);

  return [isDark, toggleDarkMode];
};

export default useDarkMode;

