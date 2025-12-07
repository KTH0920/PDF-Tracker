import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilePdf, FaTrash, FaSpinner, FaUpload, FaBookOpen } from 'react-icons/fa';

const DashboardZen = ({
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
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 font-serif">
      <div className="max-w-6xl mx-auto px-8 md:px-16 py-12">
        {/* 헤더 */}
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-serif text-stone-800 dark:text-stone-200 mb-4">
            My Library
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-lg">
            {user?.email || 'Reader'}
          </p>
        </div>

        {/* 업로드 영역 */}
        <div className="mb-16">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border border-stone-300 dark:border-stone-700 rounded-none p-16 text-center transition-all ${
              dragActive
                ? 'bg-stone-100 dark:bg-stone-800 border-stone-400'
                : 'bg-white dark:bg-stone-800/50 hover:border-stone-400 dark:hover:border-stone-600'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="file"
              id="file-upload-zen"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="file-upload-zen" className="cursor-pointer">
              {uploading ? (
                <div className="flex flex-col items-center gap-6">
                  <FaSpinner className="text-4xl text-stone-600 dark:text-stone-400 animate-spin" />
                  <p className="text-stone-600 dark:text-stone-300 text-lg">업로드 중...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <FaUpload className="text-5xl text-stone-400 dark:text-stone-500" />
                  <div>
                    <p className="text-xl font-serif text-stone-700 dark:text-stone-300 mb-2">
                      PDF 파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-stone-500 dark:text-stone-400">
                      PDF 파일만 업로드 가능합니다
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 책 목록 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="text-4xl text-stone-400 animate-spin" />
          </div>
        ) : pdfs.length === 0 ? (
          <div className="text-center py-20">
            <FaBookOpen className="text-8xl text-stone-300 dark:text-stone-700 mx-auto mb-6" />
            <p className="text-stone-500 dark:text-stone-400 text-xl">업로드된 PDF가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pdfs.map((pdf, index) => (
              <motion.div
                key={pdf._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 p-8 hover:border-stone-400 dark:hover:border-stone-600 transition-colors cursor-pointer group"
                onClick={() => navigate(`/viewer/${pdf._id}`)}
              >
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <FaFilePdf className="text-3xl text-stone-600 dark:text-stone-400" />
                      <div>
                        <h2 className="text-2xl font-serif text-stone-800 dark:text-stone-200 mb-1">
                          {pdf.title}
                        </h2>
                        <p className="text-stone-500 dark:text-stone-400 text-sm">
                          {user?.email || 'Unknown'} · {formatDate(pdf.lastAccessed)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-12 space-y-2 text-stone-600 dark:text-stone-400">
                      <p className="text-sm">총 페이지: {pdf.totalPage || 'N/A'}</p>
                      <p className="text-sm">현재 페이지: {pdf.currentPage || 1}</p>
                      {(pdf.progress || 0) > 0 && (
                        <div className="mt-4">
                          <div className="w-full bg-stone-200 dark:bg-stone-700 h-1">
                            <div
                              className="bg-stone-600 dark:bg-stone-400 h-1 transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, pdf.progress || 0))}%` }}
                            />
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                            진행률: {Math.round(pdf.progress || 0)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(e, pdf._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-stone-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardZen;

