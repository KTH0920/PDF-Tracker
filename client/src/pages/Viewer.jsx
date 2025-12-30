import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { updateProgress, fetchPDFs } from '../api';
import { getUser } from '../auth';
import { FaArrowLeft, FaCheckCircle, FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pageRefs = useRef({});
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(120);
  const isScrollingRef = useRef(false);

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
    
    // 프로그래밍 방식 스크롤 중이면 페이지 감지 건너뛰기
    if (isScrollingRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    // 각 페이지 요소의 위치를 확인하여 현재 페이지 계산
    let calculatedPage = 1;
    let minDistance = Infinity;
    
    for (let i = 1; i <= numPages; i++) {
      const pageElement = pageRefs.current[i];
      if (pageElement) {
        const pageTop = pageElement.offsetTop - container.offsetTop;
        const pageBottom = pageTop + pageElement.offsetHeight;
        const pageCenter = pageTop + pageElement.offsetHeight / 2;
        
        // 뷰포트 중앙에 가장 가까운 페이지 찾기
        const viewportCenter = scrollTop + container.clientHeight / 2;
        const distance = Math.abs(viewportCenter - pageCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          calculatedPage = i;
        }
        
        // 스크롤 위치가 페이지 범위 내에 있으면 해당 페이지로 설정
        if (scrollTop >= pageTop - 50 && scrollTop < pageBottom) {
          calculatedPage = i;
          break;
        }
      }
    }

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

  // 페이지로 스크롤 이동
  const scrollToPage = useCallback((pageNumber) => {
    const pageElement = pageRefs.current[pageNumber];
    if (pageElement && containerRef.current) {
      const container = containerRef.current;
      const pageTop = pageElement.offsetTop - container.offsetTop;
      
      // 즉시 현재 페이지 업데이트
      setCurrentPage(pageNumber);
      
      // 프로그래밍 방식 스크롤 시작
      isScrollingRef.current = true;
      
      container.scrollTo({
        top: pageTop - 20, // 약간의 여백
        behavior: 'smooth',
      });
      
      // 스크롤 애니메이션이 완료될 때까지 대기 (약 500ms)
      setTimeout(() => {
        isScrollingRef.current = false;
        // 스크롤 완료 후 정확한 페이지 다시 계산
        if (containerRef.current) {
          const finalScrollTop = containerRef.current.scrollTop;
          const container = containerRef.current;
          
          let calculatedPage = 1;
          let minDistance = Infinity;
          
          for (let i = 1; i <= numPages; i++) {
            const pageEl = pageRefs.current[i];
            if (pageEl) {
              const pageTop = pageEl.offsetTop - container.offsetTop;
              const pageCenter = pageTop + pageEl.offsetHeight / 2;
              const viewportCenter = finalScrollTop + container.clientHeight / 2;
              const distance = Math.abs(viewportCenter - pageCenter);
              
              if (distance < minDistance) {
                minDistance = distance;
                calculatedPage = i;
              }
            }
          }
          
          setCurrentPage(calculatedPage);
        }
      }, 600); // smooth 스크롤 애니메이션 시간보다 약간 길게
    }
  }, [numPages]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // 헤더 높이 측정 (border 포함)
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        setHeaderHeight(rect.height);
      }
    };
    
    // 초기 측정
    updateHeaderHeight();
    
    // 약간의 지연 후 재측정 (렌더링 완료 후)
    const timeoutId = setTimeout(updateHeaderHeight, 100);
    
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Sticky Progress Bar */}
      <div ref={headerRef} className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="페이지 목록 열기"
                >
                  <FaBars className="text-lg" />
                </button>
              )}
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

      {/* 메인 컨텐츠 영역 (사이드바 + PDF 뷰어) */}
      <div className="flex flex-1 relative">
        {/* 페이지 썸네일 사이드바 */}
        <div
          className={`fixed left-0 bg-white dark:bg-gray-800 shadow-lg border-r dark:border-gray-700 z-40 transition-transform duration-300 overflow-y-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ 
            width: '240px',
            top: `${headerHeight}px`, // 헤더 높이만큼 아래로
            height: `calc(100vh - ${headerHeight}px)` // 헤더 높이 제외
          }}
        >
          <div className="p-3 sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">페이지</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </div>
          <div className="p-2">
            {normalizedFilePath && numPages && numPages > 0 ? (
              <Document
                file={normalizedFilePath}
                loading={
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                }
                options={pdfOptions}
              >
                {Array.from({ length: numPages }, (_, index) => {
                  const pageNum = index + 1;
                  return (
                    <div
                      key={`thumbnail_${pageNum}`}
                      onClick={() => scrollToPage(pageNum)}
                      className={`mb-2 p-2 rounded cursor-pointer transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 dark:border-blue-400'
                          : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Page
                        pageNumber={pageNum}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        width={200}
                        className="shadow-sm"
                      />
                      <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-300 font-medium">
                        {pageNum}
                      </div>
                    </div>
                  );
                })}
              </Document>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                페이지 로딩 중...
              </div>
            )}
          </div>
        </div>

        {/* PDF 뷰어 영역 */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-[240px]' : 'ml-0'}`}>
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
                    <div
                      key={`page_wrapper_${index + 1}`}
                      ref={(el) => {
                        pageRefs.current[index + 1] = el;
                      }}
                    >
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="mb-4"
                        width={pageWidth}
                      />
                    </div>
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
      </div>
    </div>
  );
};

export default Viewer;

