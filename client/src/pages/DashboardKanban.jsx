import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilePdf, FaTrash, FaSpinner, FaUpload, FaCheckCircle } from 'react-icons/fa';

const DashboardKanban = ({
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
  // 진행률에 따라 PDF 분류
  const notStarted = pdfs.filter((pdf) => (pdf.progress || 0) === 0);
  const inProgress = pdfs.filter((pdf) => (pdf.progress || 0) > 0 && (pdf.progress || 0) < 100);
  const completed = pdfs.filter((pdf) => (pdf.progress || 0) === 100);

  const columns = [
    { id: 'not-started', title: '시작 전', pdfs: notStarted, color: 'gray' },
    { id: 'in-progress', title: '학습 중', pdfs: inProgress, color: 'blue' },
    { id: 'completed', title: '완료', pdfs: completed, color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
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
            id="file-upload-kanban"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />
          <label htmlFor="file-upload-kanban" className="cursor-pointer">
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

      {/* 칸반 보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            {/* 컬럼 헤더 */}
            <div className="bg-white dark:bg-gray-800 rounded-t-lg p-4 shadow-sm border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {column.title}
                </h2>
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold px-2 py-1 rounded">
                  {column.pdfs.length}
                </span>
              </div>
            </div>

            {/* 카드 리스트 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-b-lg p-4 min-h-[400px] space-y-3">
              {column.pdfs.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                  <p>비어있음</p>
                </div>
              ) : (
                column.pdfs.map((pdf) => (
                  <motion.div
                    key={pdf._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                    onClick={() => navigate(`/viewer/${pdf._id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FaFilePdf className="text-red-500 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate text-sm">
                          {pdf.title}
                        </h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(e, pdf._id);
                        }}
                        className="flex-shrink-0 p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>

                    {column.id === 'in-progress' && (
                      <div className="mb-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, pdf.progress || 0))}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {Math.round(pdf.progress || 0)}%
                        </p>
                      </div>
                    )}

                    {column.id === 'completed' && (
                      <div className="flex items-center gap-1 text-green-500 text-xs mb-2">
                        <FaCheckCircle />
                        <span>완료</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>페이지: {pdf.currentPage || 1} / {pdf.totalPage || 'N/A'}</p>
                      <p>{formatDate(pdf.lastAccessed)}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {!loading && pdfs.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg">
          <FaFilePdf className="text-8xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-xl">업로드된 PDF가 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default DashboardKanban;

