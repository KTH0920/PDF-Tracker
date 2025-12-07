import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { fetchPDFs, uploadPDF } from '../api';
import { FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import { deletePDF } from '../api';
import useDarkMode from '../hooks/useDarkMode';
import DashboardNetflix from './DashboardNetflix';
import DashboardKanban from './DashboardKanban';
import DashboardDev from './DashboardDev';
import DashboardZen from './DashboardZen';
import DashboardGame from './DashboardGame';
import DashboardBento from './DashboardBento';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeView, setActiveView] = useState('netflix'); // 'netflix', 'kanban', 'dev', 'zen', 'game', 'bento'
  const navigate = useNavigate();
  const [isDark, toggleDarkMode] = useDarkMode();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadPDFs(currentUser.uid);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadPDFs = async (userId) => {
    try {
      setLoading(true);
      const data = await fetchPDFs(userId);
      setPdfs(data.pdfs || []);
    } catch (error) {
      console.error('PDF 목록 로드 실패:', error);
      alert('PDF 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('PDF 파일만 업로드 가능합니다.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('userId', user.uid);
      formData.append('title', file.name);

      await uploadPDF(formData);
      await loadPDFs(user.uid);
      alert('파일 업로드가 완료되었습니다!');
    } catch (error) {
      console.error('업로드 에러:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = async (e, pdfId) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    if (!window.confirm('정말 이 PDF를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deletePDF(pdfId);
      await loadPDFs(user.uid);
      alert('PDF가 삭제되었습니다.');
    } catch (error) {
      console.error('삭제 에러:', error);
      alert('PDF 삭제에 실패했습니다.');
    }
  };

  // 공통 props 객체
  const commonProps = {
    user,
    pdfs,
    loading,
    uploading,
    dragActive,
    handleFileUpload,
    handleDrag,
    handleDrop,
    handleFileInput,
    handleDelete,
    formatDate,
    navigate,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">PDF Focus Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* 뷰 전환 탭 - 가로 스크롤 */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto scrollbar-hide max-w-md">
              {[
                { id: 'netflix', label: 'Netflix' },
                { id: 'kanban', label: 'Kanban' },
                { id: 'dev', label: 'Terminal' },
                { id: 'zen', label: 'Zen' },
                { id: 'game', label: 'Game' },
                { id: 'bento', label: 'Bento' },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeView === view.id
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDark ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <FaSignOutAlt />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 선택된 뷰 렌더링 */}
      <main>
        {activeView === 'netflix' && <DashboardNetflix {...commonProps} />}
        {activeView === 'kanban' && <DashboardKanban {...commonProps} />}
        {activeView === 'dev' && <DashboardDev {...commonProps} />}
        {activeView === 'zen' && <DashboardZen {...commonProps} />}
        {activeView === 'game' && <DashboardGame {...commonProps} />}
        {activeView === 'bento' && <DashboardBento {...commonProps} />}
      </main>
    </div>
  );
};

export default Dashboard;

