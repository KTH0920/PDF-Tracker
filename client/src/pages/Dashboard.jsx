import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { fetchPDFs, uploadPDF } from '../api';
import { FaSignOutAlt, FaUpload, FaFilePdf, FaSpinner, FaTrash, FaSun, FaMoon } from 'react-icons/fa';
import { deletePDF } from '../api';
import useDarkMode from '../hooks/useDarkMode';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">PDF Focus Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 업로드 영역 */}
        <div className="mb-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                  <FaSpinner className="text-4xl text-blue-500 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-300">업로드 중...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <FaUpload className="text-5xl text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      PDF 파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      PDF 파일만 업로드 가능합니다
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 학습 목록 */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">내 학습 목록</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <FaSpinner className="text-4xl text-blue-500 animate-spin" />
            </div>
          ) : pdfs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <FaFilePdf className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">업로드된 PDF가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pdfs.map((pdf) => (
                <div
                  key={pdf._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700 relative"
                >
                  <div className="flex items-start gap-4">
                    <FaFilePdf className="text-4xl text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 
                          className="font-semibold text-gray-800 dark:text-white truncate cursor-pointer"
                          onClick={() => navigate(`/viewer/${pdf._id}`)}
                        >
                          {pdf.title}
                        </h3>
                        <button
                          onClick={(e) => handleDelete(e, pdf._id)}
                          className="flex-shrink-0 p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                      <div 
                        className="space-y-1 text-sm text-gray-600 dark:text-gray-300 cursor-pointer"
                        onClick={() => navigate(`/viewer/${pdf._id}`)}
                      >
                        <p>총 페이지: {pdf.totalPage || 'N/A'}</p>
                        <p>현재 페이지: {pdf.currentPage || 1}</p>
                        <p>마지막 접근: {formatDate(pdf.lastAccessed)}</p>
                      </div>
                      <div 
                        className="mt-3 cursor-pointer"
                        onClick={() => navigate(`/viewer/${pdf._id}`)}
                      >
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, pdf.progress || 0))}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          진행률: {Math.round(pdf.progress || 0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

