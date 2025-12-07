import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilePdf, FaTrash, FaSpinner, FaUpload, FaTrophy, FaStar } from 'react-icons/fa';

const DashboardGame = ({
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
  // 총 진행률 계산 (XP)
  const totalProgress = pdfs.length > 0
    ? pdfs.reduce((sum, pdf) => sum + (pdf.progress || 0), 0) / pdfs.length
    : 0;
  
  // 레벨 계산 (간단한 공식)
  const userLevel = Math.floor(totalProgress / 20) + 1;
  const currentXP = totalProgress % 20;
  const nextLevelXP = 20;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* User Level & XP Bar */}
        <div className="bg-white dark:bg-gray-800 border-4 border-black rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white">
                Level {userLevel} Reader
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{user?.email || 'Player'}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-500">⭐</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">XP: {Math.round(currentXP)}/{nextLevelXP}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 border-2 border-black">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
              transition={{ duration: 1 }}
              className="bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 h-full rounded-full border-2 border-black"
            />
          </div>
        </div>

        {/* 업로드 영역 */}
        <div className="mb-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-4 border-black rounded-full p-8 text-center transition-all ${
              dragActive
                ? 'bg-yellow-200 dark:bg-yellow-900/30'
                : 'bg-white dark:bg-gray-800 hover:bg-pink-100 dark:hover:bg-gray-700'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''} shadow-lg`}
          >
            <input
              type="file"
              id="file-upload-game"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="file-upload-game" className="cursor-pointer">
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <FaSpinner className="text-4xl text-blue-500 animate-spin" />
                  <p className="text-black dark:text-white font-bold">업로드 중...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <FaUpload className="text-5xl text-blue-500" />
                  <div>
                    <p className="text-lg font-bold text-black dark:text-white mb-2">
                      PDF 파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      PDF 파일만 업로드 가능합니다
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Quest Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="text-4xl text-blue-500 animate-spin" />
          </div>
        ) : pdfs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 border-4 border-black rounded-2xl">
            <FaFilePdf className="text-8xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-xl font-bold">업로드된 PDF가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pdfs.map((pdf, index) => {
              const isCompleted = (pdf.progress || 0) === 100;
              const isInProgress = (pdf.progress || 0) > 0 && (pdf.progress || 0) < 100;
              
              return (
                <motion.div
                  key={pdf._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white dark:bg-gray-800 border-4 border-black rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform shadow-lg ${
                    isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}
                  onClick={() => navigate(`/viewer/${pdf._id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full border-2 border-black ${
                        isCompleted ? 'bg-green-400' : isInProgress ? 'bg-blue-400' : 'bg-gray-300'
                      }`}>
                        <FaFilePdf className="text-2xl text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-black dark:text-white text-sm line-clamp-2">
                          {pdf.title}
                        </h3>
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="bg-yellow-400 border-2 border-black rounded-full px-3 py-1 flex items-center gap-1">
                        <FaTrophy className="text-xs" />
                        <span className="text-xs font-bold">Clear!</span>
                      </div>
                    )}
                  </div>

                  {isInProgress && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 border-2 border-black mb-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-pink-400 h-full rounded-full border border-black"
                          style={{ width: `${Math.min(100, Math.max(0, pdf.progress || 0))}%` }}
                        />
                      </div>
                      <p className="text-xs font-bold text-black dark:text-white">
                        진행률: {Math.round(pdf.progress || 0)}%
                      </p>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-4">
                    <p>📄 페이지: {pdf.currentPage || 1} / {pdf.totalPage || 'N/A'}</p>
                    <p>📅 {formatDate(pdf.lastAccessed)}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(e, pdf._id);
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full border-2 border-black transition-colors"
                  >
                    <FaTrash className="inline mr-2" />
                    삭제
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardGame;

