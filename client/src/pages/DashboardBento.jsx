import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilePdf, FaTrash, FaSpinner, FaUpload, FaChartBar, FaBook } from 'react-icons/fa';

const DashboardBento = ({
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
  // 가장 최근 읽은 PDF
  const getRecentPDF = () => {
    if (!pdfs || pdfs.length === 0) return null;
    return pdfs
      .filter((pdf) => pdf.progress > 0)
      .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))[0] || pdfs[0];
  };

  const recentPDF = getRecentPDF();
  const otherPDFs = pdfs.filter((pdf) => pdf._id !== recentPDF?._id);

  // 통계 계산
  const stats = {
    total: pdfs.length,
    inProgress: pdfs.filter((pdf) => (pdf.progress || 0) > 0 && (pdf.progress || 0) < 100).length,
    completed: pdfs.filter((pdf) => (pdf.progress || 0) === 100).length,
    avgProgress: pdfs.length > 0
      ? Math.round(pdfs.reduce((sum, pdf) => sum + (pdf.progress || 0), 0) / pdfs.length)
      : 0,
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 업로드 영역 */}
        <div className="mb-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="file"
              id="file-upload-bento"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="file-upload-bento" className="cursor-pointer">
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

        {/* Bento Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="text-4xl text-blue-500 animate-spin" />
          </div>
        ) : pdfs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-700 rounded-3xl">
            <FaFilePdf className="text-8xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-xl">업로드된 PDF가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 auto-rows-fr">
            {/* 최근 읽은 PDF - 큰 박스 */}
            {recentPDF && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-4 md:col-span-2 row-span-2 bg-white dark:bg-gray-700 rounded-3xl p-8 cursor-pointer hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-600"
                onClick={() => navigate(`/viewer/${recentPDF._id}`)}
              >
                <div className="h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                        <FaBook className="text-2xl text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">최근 읽은 문서</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 line-clamp-2">
                      {recentPDF.title}
                    </h2>
                    <div className="space-y-2 text-gray-600 dark:text-gray-300 mb-6">
                      <p>페이지: {recentPDF.currentPage || 1} / {recentPDF.totalPage || 'N/A'}</p>
                      <p>{formatDate(recentPDF.lastAccessed)}</p>
                    </div>
                    {(recentPDF.progress || 0) > 0 && (
                      <div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-2">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, recentPDF.progress || 0))}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          진행률: {Math.round(recentPDF.progress || 0)}%
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(e, recentPDF._id);
                    }}
                    className="mt-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors w-fit"
                  >
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 통계 박스 - 세로로 긴 박스 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-4 md:col-span-2 row-span-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-3xl p-6 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-200 dark:bg-purple-800/50 rounded-2xl">
                  <FaChartBar className="text-2xl text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">통계</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">전체 문서</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">학습 중</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">완료</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">평균 진행률</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.avgProgress}%</p>
                </div>
              </div>
            </motion.div>

            {/* 나머지 PDF들 - 작은 박스들 */}
            {otherPDFs.slice(0, 6).map((pdf, index) => (
              <motion.div
                key={pdf._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="col-span-2 bg-white dark:bg-gray-700 rounded-3xl p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-600"
                onClick={() => navigate(`/viewer/${pdf._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <FaFilePdf className="text-2xl text-red-500 flex-shrink-0" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(e, pdf._id);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-2 line-clamp-2">
                  {pdf.title}
                </h3>
                {(pdf.progress || 0) > 0 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, pdf.progress || 0))}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(pdf.progress || 0)}%
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardBento;

