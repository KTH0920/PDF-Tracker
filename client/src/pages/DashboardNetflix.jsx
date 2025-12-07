import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilePdf, FaTrash, FaPlay, FaSpinner, FaUpload } from 'react-icons/fa';

const DashboardNetflix = ({
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
}) => {
  // 가장 최근 읽은 PDF 찾기
  const getRecentPDF = () => {
    if (!pdfs || pdfs.length === 0) return null;
    return pdfs
      .filter((pdf) => pdf.progress > 0 && pdf.progress < 100)
      .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))[0] || pdfs[0];
  };

  const recentPDF = getRecentPDF();
  const watchingPDFs = pdfs.filter((pdf) => pdf.progress > 0 && pdf.progress < 100);
  const completedPDFs = pdfs.filter((pdf) => pdf.progress === 100);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section - 최근 읽은 PDF */}
      {recentPDF && (
        <div className="relative h-[60vh] overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent z-10"
          />
          <div className="absolute inset-0 flex items-center z-20 px-8 md:px-16">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">
                {recentPDF.title}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-lg">
                  진행률: {Math.round(recentPDF.progress || 0)}%
                </div>
                <div className="text-lg">
                  페이지 {recentPDF.currentPage || 1} / {recentPDF.totalPage || '?'}
                </div>
              </div>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/viewer/${recentPDF._id}`)}
                  className="flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-200 transition-colors"
                >
                  <FaPlay />
                  계속 읽기
                </motion.button>
              </div>
            </div>
          </div>
          {/* 배경 그라디언트 */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 to-gray-900 z-0" />
        </div>
      )}

      <div className="px-4 md:px-8 pb-8">
        {/* 업로드 영역 */}
        <div className="mb-8 mt-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? 'border-red-500 bg-red-900/20'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="file"
              id="file-upload-netflix"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="file-upload-netflix" className="cursor-pointer">
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <FaSpinner className="text-4xl text-red-500 animate-spin" />
                  <p className="text-gray-300">업로드 중...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <FaUpload className="text-5xl text-gray-500" />
                  <div>
                    <p className="text-lg font-semibold text-gray-200 mb-2">
                      PDF 파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-sm text-gray-400">
                      PDF 파일만 업로드 가능합니다
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 시청 중인 콘텐츠 */}
        {watchingPDFs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 px-2">시청 중인 콘텐츠</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {watchingPDFs.map((pdf) => (
                <motion.div
                  key={pdf._id}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  className="flex-shrink-0 w-48 cursor-pointer group relative"
                  onClick={() => navigate(`/viewer/${pdf._id}`)}
                >
                  <div className="relative aspect-[2/3] bg-gray-800 rounded overflow-hidden shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaFilePdf className="text-6xl text-red-500" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                      <h3 className="text-sm font-semibold truncate mb-1">{pdf.title}</h3>
                      <div className="w-full bg-gray-700 rounded-full h-1 mb-2">
                        <div
                          className="bg-red-500 h-1 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, pdf.progress || 0))}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        {Math.round(pdf.progress || 0)}% 완료
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(e, pdf._id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 다시 보기 (완독) */}
        {completedPDFs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 px-2">다시 보기</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {completedPDFs.map((pdf) => (
                <motion.div
                  key={pdf._id}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  className="flex-shrink-0 w-48 cursor-pointer group relative"
                  onClick={() => navigate(`/viewer/${pdf._id}`)}
                >
                  <div className="relative aspect-[2/3] bg-gray-800 rounded overflow-hidden shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaFilePdf className="text-6xl text-green-500" />
                    </div>
                    <div className="absolute top-2 left-2 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded">
                      완료
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                      <h3 className="text-sm font-semibold truncate">{pdf.title}</h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(e, pdf._id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && pdfs.length === 0 && (
          <div className="text-center py-20">
            <FaFilePdf className="text-8xl text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-xl">업로드된 PDF가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardNetflix;

