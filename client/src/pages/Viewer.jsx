import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { updateProgress, fetchPDFs } from '../api';
import { auth } from '../firebase';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Viewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const lastUpdateTime = useRef(0);
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        loadPDFInfo(currentUser.uid);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadPDFInfo = async (userId) => {
    try {
      const data = await fetchPDFs(userId);
      const pdf = data.pdfs.find((p) => p._id === id);
      if (pdf) {
        setPdfInfo(pdf);
        setCurrentPage(pdf.currentPage || 1);
        setProgress(pdf.progress || 0);
        if (pdf.progress >= 100) {
          setIsComplete(true);
        }
      }
    } catch (error) {
      console.error('PDF 정보 로드 실패:', error);
      alert('PDF 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateProgressToServer = useCallback(
    async (page, prog) => {
      if (!pdfInfo || !user) return;

      const now = Date.now();
      // 최소 1초 간격으로 업데이트 (너무 자주 호출 방지)
      if (now - lastUpdateTime.current < 1000) {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
          updateProgressToServer(page, prog);
        }, 1000 - (now - lastUpdateTime.current));
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

    setScrollProgress(scrollPercentage);

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

    if (Math.abs(calculatedProgress - progress) > 1) {
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
      container.addEventListener('scroll', handleScroll);
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

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF 로드 에러:', error);
    alert('PDF 파일을 불러오는데 실패했습니다.');
    setLoading(false);
  };

  if (loading && !pdfInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">PDF를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!pdfInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">PDF를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <FaArrowLeft />
                뒤로가기
              </button>
              <h2 className="text-lg font-semibold text-gray-800 truncate">
                {pdfInfo.title}
              </h2>
            </div>
            <div className="text-sm text-gray-600">
              페이지 {currentPage} / {numPages || '?'}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              진행률: {Math.round(progress)}%
            </span>
            {isComplete && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
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
        <div className="bg-white shadow-lg rounded-lg p-4">
          <Document
            file={pdfInfo.filePath}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="mb-4"
                width={Math.min(800, window.innerWidth - 64)}
              />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default Viewer;

