import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { updateProgress, fetchPDFs } from '../api';
import { getUser } from '../auth';
import { FaArrowLeft, FaCheckCircle, FaSun, FaMoon, FaBars, FaTimes, FaSearch, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import useDarkMode from '../hooks/useDarkMode';
import { PROGRESS_UPDATE_INTERVAL, PROGRESS_UPDATE_THRESHOLD, DEFAULT_PAGE_WIDTH, PAGE_PADDING } from '../utils/constants';
import ResumeModal from '../components/ResumeModal';
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
  const [showResumeModal, setShowResumeModal] = useState(false);
  const savedPageRef = useRef(null);
  const savedProgressRef = useRef(null);
  const sidebarRef = useRef(null);
  const thumbnailRefs = useRef({});
  const [pageSearchValue, setPageSearchValue] = useState('');

  const loadPDFInfo = useCallback(async () => {
    try {
      const data = await fetchPDFs();
      const pdf = data.pdfs.find((p) => p._id === id);
      if (pdf) {
        console.log('PDF 정보 로드 성공:', pdf);
        console.log('PDF 파일 경로:', pdf.filePath);
        setPdfInfo(pdf);
        
        const savedPage = pdf.currentPage || 1;
        const savedProgress = pdf.progress || 0;
        
        savedPageRef.current = savedPage;
        savedProgressRef.current = savedProgress;
        
        // 진행률이 0보다 크고 100%가 아니면 재개 모달 표시
        if (savedProgress > 0 && savedProgress < 100) {
          setShowResumeModal(true);
          // 모달이 표시되는 동안은 진행률을 설정하지 않음
        } else {
          setCurrentPage(savedPage);
          setProgress(savedProgress);
          if (savedProgress >= 100) {
            setIsComplete(true);
          }
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

  // 사이드바 썸네일로 스크롤
  const scrollToThumbnail = useCallback((pageNumber) => {
    // 약간의 지연을 두어 DOM 업데이트 완료 후 실행
    setTimeout(() => {
      const thumbnailElement = thumbnailRefs.current[pageNumber];
      const sidebar = sidebarRef.current;
      
      if (thumbnailElement && sidebar) {
        // 썸네일의 실제 위치 계산 (부모 요소 기준)
        const thumbnailRect = thumbnailElement.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();
        const relativeTop = thumbnailRect.top - sidebarRect.top + sidebar.scrollTop;
        
        const sidebarHeight = sidebar.clientHeight;
        const thumbnailHeight = thumbnailElement.offsetHeight;
        
        // 썸네일이 뷰포트 중앙에 오도록 스크롤
        const scrollPosition = relativeTop - (sidebarHeight / 2) + (thumbnailHeight / 2);
        
        sidebar.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth',
        });
      }
    }, 100);
  }, []);

  // 페이지로 스크롤 이동
  const scrollToPage = useCallback((pageNumber) => {
    const pageElement = pageRefs.current[pageNumber];
    if (pageElement && containerRef.current) {
      const container = containerRef.current;
      
      // 페이지 요소의 정확한 위치 계산
      const pageRect = pageElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = pageRect.top - containerRect.top + container.scrollTop;
      
      // 즉시 현재 페이지 업데이트
      setCurrentPage(pageNumber);
      
      // 프로그래밍 방식 스크롤 시작
      isScrollingRef.current = true;
      
      container.scrollTo({
        top: relativeTop - 20, // 약간의 여백
        behavior: 'smooth',
      });
      
      // 사이드바 썸네일도 스크롤 (약간의 지연을 두어 PDF 스크롤과 동기화)
      setTimeout(() => {
        scrollToThumbnail(pageNumber);
      }, 150);
      
      // 스크롤 애니메이션이 완료될 때까지 대기
      setTimeout(() => {
        // 프로그래밍 방식 스크롤이므로 입력받은 페이지 번호 유지
        setCurrentPage(pageNumber);
        // 추가 지연 후 스크롤 플래그 해제 (handleScroll이 잘못된 페이지를 계산하지 않도록)
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 200);
      }, 600); // smooth 스크롤 애니메이션 시간보다 약간 길게
    }
  }, [numPages, scrollToThumbnail]);

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

  // PDF 로드 완료 후 마지막 위치로 스크롤 (재개 모달이 닫힌 후, 마지막 위치에서 시작 선택 시)
  useEffect(() => {
    if (!showResumeModal && numPages && savedPageRef.current && savedProgressRef.current > 0 && progress === savedProgressRef.current) {
      // 재개 모달이 닫히고 PDF가 로드된 후 마지막 위치로 스크롤 (진행률이 저장된 값과 같을 때만)
      setTimeout(() => {
        if (pageRefs.current[savedPageRef.current]) {
          scrollToPage(savedPageRef.current);
        }
      }, 500);
    }
  }, [showResumeModal, numPages, scrollToPage, progress]);

  // 현재 페이지가 변경될 때 사이드바 썸네일 스크롤
  useEffect(() => {
    if (currentPage && sidebarOpen) {
      // 약간의 지연을 두어 페이지 변경이 완료된 후 스크롤
      const timeoutId = setTimeout(() => {
        scrollToThumbnail(currentPage);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, sidebarOpen, scrollToThumbnail]);

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

  // 페이지 검색 핸들러
  const handlePageSearch = useCallback((e) => {
    e.preventDefault();
    const pageNum = parseInt(pageSearchValue, 10);
    
    if (isNaN(pageNum) || pageNum < 1 || (numPages && pageNum > numPages)) {
      alert(`유효한 페이지 번호를 입력해주세요. (1 ~ ${numPages || '?'})`);
      setPageSearchValue('');
      return;
    }
    
    scrollToPage(pageNum);
    setPageSearchValue('');
  }, [pageSearchValue, numPages, scrollToPage]);

  // 페이지 증가
  const handlePageIncrement = useCallback(() => {
    const current = parseInt(pageSearchValue, 10) || 1;
    const next = Math.min(current + 1, numPages || 1);
    setPageSearchValue(next.toString());
  }, [pageSearchValue, numPages]);

  // 페이지 감소
  const handlePageDecrement = useCallback(() => {
    const current = parseInt(pageSearchValue, 10) || 1;
    const prev = Math.max(current - 1, 1);
    setPageSearchValue(prev.toString());
  }, [pageSearchValue]);

  // 마지막 위치에서 재개
  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (savedPageRef.current && savedProgressRef.current !== null) {
      setCurrentPage(savedPageRef.current);
      setProgress(savedProgressRef.current);
      // 스크롤은 useEffect에서 처리
    }
  }, []);

  // 처음부터 시작
  const handleRestart = useCallback(async () => {
    setShowResumeModal(false);
    setCurrentPage(1);
    setProgress(0);
    setIsComplete(false);
    
    // 저장된 위치 정보 초기화 (useEffect에서 마지막 위치로 스크롤하지 않도록)
    savedPageRef.current = null;
    savedProgressRef.current = null;
    
    // 서버에 진행률 초기화
    if (pdfInfo) {
      try {
        await updateProgress(pdfInfo._id, 1, 0);
      } catch (error) {
        console.error('진행률 초기화 실패:', error);
      }
    }
    
    // 1페이지로 스크롤
    if (numPages && numPages > 0) {
      setTimeout(() => {
        scrollToPage(1);
      }, 100);
    }
  }, [pdfInfo, numPages, scrollToPage]);


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
              {/* 페이지 검색창 */}
              <form onSubmit={handlePageSearch} className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pageSearchValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      // 숫자만 입력 허용
                      if (value === '' || /^\d+$/.test(value)) {
                        setPageSearchValue(value);
                      }
                    }}
                    placeholder="페이지 번호"
                    className="w-40 px-3 py-1.5 pl-8 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs" />
                  {/* 커스텀 스피너 버튼 */}
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
                    <button
                      type="button"
                      onClick={handlePageIncrement}
                      className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      disabled={!numPages || parseInt(pageSearchValue, 10) >= (numPages || 1)}
                    >
                      <FaChevronUp className="text-xs" />
                    </button>
                    <button
                      type="button"
                      onClick={handlePageDecrement}
                      className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      disabled={parseInt(pageSearchValue, 10) <= 1}
                    >
                      <FaChevronDown className="text-xs" />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
                >
                  이동
                </button>
              </form>
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
          ref={sidebarRef}
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
                      ref={(el) => {
                        thumbnailRefs.current[pageNum] = el;
                      }}
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

      {/* 재개 모달 */}
      {showResumeModal && (
        <ResumeModal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          onResume={handleResume}
          onRestart={handleRestart}
          title="학습 재개"
          message={`이전에 ${Math.round(savedProgressRef.current || 0)}%까지 학습하셨습니다. 어디서부터 시작하시겠습니까?`}
          progress={savedProgressRef.current || 0}
          currentPage={savedPageRef.current || 1}
        />
      )}
    </div>
  );
};

export default Viewer;

