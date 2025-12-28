import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { updateProgress, fetchPDFs } from '../api';
import { getUser } from '../auth';
import { FaArrowLeft, FaCheckCircle, FaSun, FaMoon } from 'react-icons/fa';
import useDarkMode from '../hooks/useDarkMode';
import { PROGRESS_UPDATE_INTERVAL, PROGRESS_UPDATE_THRESHOLD, DEFAULT_PAGE_WIDTH, PAGE_PADDING } from '../utils/constants';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker 설정 - unpkg CDN 사용 (mjs 확장자)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Viewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const lastUpdateTime = useRef(0);
  const updateTimeoutRef = useRef(null);
  const [isDark, toggleDarkMode] = useDarkMode();

  const loadPDFInfo = useCallback(async () => {
    try {
      const data = await fetchPDFs();
      const pdf = data.pdfs.find((p) => p._id === id);
      if (pdf) {
        console.log('PDF 정보 로드 성공:', pdf);
        console.log('PDF 파일 경로:', pdf.filePath);
        setPdfInfo(pdf);
        setCurrentPage(pdf.currentPage || 1);
        setProgress(pdf.progress || 0);
        if (pdf.progress >= 100) {
          setIsComplete(true);
        }
      } else {
        console.error('PDF를 찾을 수 없습니다. ID:', id);
      }
    } catch (error) {
      console.error('PDF 정보 로드 실패:', error);
      alert('PDF 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      loadPDFInfo();
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, loadPDFInfo]);

  const updateProgressToServer = useCallback(
    async (page, prog) => {
      if (!pdfInfo || !user) return;

      const now = Date.now();
      // 최소 간격으로 업데이트 (너무 자주 호출 방지)
      if (now - lastUpdateTime.current < PROGRESS_UPDATE_INTERVAL) {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
          updateProgressToServer(page, prog);
        }, PROGRESS_UPDATE_INTERVAL - (now - lastUpdateTime.current));
        return;
      }

      lastUpdateTime.current = now;

      try {
        await updateProgress(pdfInfo._id, page, prog);
      } catch (error) {
        console.error('진행률 업데이트 실패:', error);
      }
    },
    [pdfInfo, user]
  );

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !numPages) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    // 스크롤 위치를 기반으로 현재 페이지 계산
    const pageHeight = scrollHeight / numPages;
    const calculatedPage = Math.min(
      Math.max(1, Math.floor(scrollTop / pageHeight) + 1),
      numPages
    );

    if (calculatedPage !== currentPage) {
      setCurrentPage(calculatedPage);
    }

    // 진행률 계산 (0~100)
    const calculatedProgress = Math.min(100, Math.max(0, scrollPercentage));

    if (Math.abs(calculatedProgress - progress) > PROGRESS_UPDATE_THRESHOLD) {
      setProgress(calculatedProgress);

      // 100% 달성 체크
      if (calculatedProgress >= 100 && !isComplete) {
        setIsComplete(true);
        alert('🎉 축하합니다! PDF 학습을 완료했습니다!');
      }

      // 서버에 업데이트 (디바운싱)
      updateProgressToServer(calculatedPage, calculatedProgress);
    }
  }, [numPages, currentPage, progress, isComplete, updateProgressToServer]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // 컴포넌트 언마운트 시 최종 진행률 저장
  useEffect(() => {
    return () => {
      if (pdfInfo && user && (currentPage || progress)) {
        updateProgress(pdfInfo._id, currentPage, progress).catch(console.error);
      }
    };
  }, [pdfInfo, user, currentPage, progress]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log('PDF 문서 로드 성공, 페이지 수:', numPages);
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('PDF 로드 에러:', error);
    console.error('에러 상세:', error.message);
    const filePath = pdfInfo?.filePath;
    console.error('PDF 경로:', filePath);
    alert(`PDF 파일을 불러오는데 실패했습니다.\n에러: ${error.message || '알 수 없는 오류'}`);
    setLoading(false);
  }, [pdfInfo]);

  // 페이지 너비 계산 (useMemo로 최적화)
  const pageWidth = useMemo(() => {
    if (typeof window === 'undefined') return DEFAULT_PAGE_WIDTH;
    return Math.min(DEFAULT_PAGE_WIDTH, window.innerWidth - PAGE_PADDING);
  }, []);

  // PDF 파일 경로 정규화 (기존 잘못된 URL 수정)
  const normalizedFilePath = useMemo(() => {
    if (!pdfInfo?.filePath) return null;
    // 5000uploads -> 5000/uploads로 수정
    let path = pdfInfo.filePath.replace(/5000uploads/g, '5000/uploads');
    // 중복 슬래시 제거 및 프로토콜 복구
    path = path.replace(/\/\/+/g, '/').replace(/:\/(?!\/)/, '://');
    console.log('정규화된 PDF 경로:', path);
    return path;
  }, [pdfInfo?.filePath]);

  // PDF.js 옵션 메모이제이션 (불필요한 리렌더링 방지)
  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  }), []);


  if (loading && !pdfInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">PDF를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!pdfInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">PDF를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                <FaArrowLeft />
                뒤로가기
              </button>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                {pdfInfo.title}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              >
                {isDark ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                페이지 {currentPage} / {numPages || '?'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              진행률: {Math.round(progress)}%
            </span>
            {isComplete && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                <FaCheckCircle />
                완료!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PDF 뷰어 */}
      <div
        ref={containerRef}
        className="max-w-4xl mx-auto px-4 py-8 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4">
          {normalizedFilePath ? (
            <Document
              file={normalizedFilePath}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              }
              options={pdfOptions}
            >
              {/* numPages state가 설정된 후에만 Page 렌더링 (Document 완전 로드 후) */}
              {numPages && numPages > 0 && Array.from({ length: numPages }, (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="mb-4"
                  width={pageWidth}
                />
              ))}
            </Document>
          ) : (
            <div className="flex justify-center py-12">
              <p className="text-gray-600 dark:text-gray-300">PDF 파일 경로가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Viewer;

