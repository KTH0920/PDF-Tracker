import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFilePdf, FaTrash, FaSpinner, FaUpload, FaTerminal } from 'react-icons/fa';

const DashboardDev = ({
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
  const stats = {
    total: pdfs.length,
    inProgress: pdfs.filter((pdf) => (pdf.progress || 0) > 0 && (pdf.progress || 0) < 100).length,
    completed: pdfs.filter((pdf) => (pdf.progress || 0) === 100).length,
    notStarted: pdfs.filter((pdf) => (pdf.progress || 0) === 0).length,
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* 터미널 헤더 */}
        <div className="border-b border-green-500/30 mb-6 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <FaTerminal className="text-green-400" />
            <span className="text-green-400">PDF Focus Tracker Terminal</span>
          </div>
          <div className="text-green-500/70 text-sm">
            <p>&gt; User: {user?.email || 'Unknown'}</p>
            <p>&gt; Status: Active</p>
            <p>&gt; Mode: Development</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-green-500/30 p-4 bg-green-500/5">
            <div className="text-green-500/70 text-xs mb-1">&gt; Total</div>
            <div className="text-2xl font-bold text-green-400">{stats.total}</div>
          </div>
          <div className="border border-yellow-500/30 p-4 bg-yellow-500/5">
            <div className="text-yellow-500/70 text-xs mb-1">&gt; In Progress</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.inProgress}</div>
          </div>
          <div className="border border-blue-500/30 p-4 bg-blue-500/5">
            <div className="text-blue-500/70 text-xs mb-1">&gt; Not Started</div>
            <div className="text-2xl font-bold text-blue-400">{stats.notStarted}</div>
          </div>
          <div className="border border-green-500/30 p-4 bg-green-500/5">
            <div className="text-green-500/70 text-xs mb-1">&gt; Completed</div>
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          </div>
        </div>

        {/* 업로드 영역 */}
        <div className="mb-8 border border-green-500/30 bg-green-500/5 p-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed transition-all ${
              dragActive
                ? 'border-green-500 bg-green-500/10'
                : 'border-green-500/30 hover:border-green-500/50'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''} p-8 text-center`}
          >
            <input
              type="file"
              id="file-upload-dev"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="file-upload-dev" className="cursor-pointer">
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <FaSpinner className="text-4xl text-green-400 animate-spin" />
                  <p className="text-green-400">&gt; Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <FaUpload className="text-5xl text-green-500/50" />
                  <div>
                    <p className="text-green-400 mb-2">&gt; Drag & Drop PDF or Click to Upload</p>
                    <p className="text-green-500/50 text-sm">PDF files only</p>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* PDF 리스트 테이블 */}
        {pdfs.length > 0 ? (
          <div className="border border-green-500/30 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-green-500/10 border-b border-green-500/30">
                <tr>
                  <th className="p-4 text-green-400">File</th>
                  <th className="p-4 text-green-400">Status</th>
                  <th className="p-4 text-green-400">Progress</th>
                  <th className="p-4 text-green-400">Pages</th>
                  <th className="p-4 text-green-400">Last Access</th>
                  <th className="p-4 text-green-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pdfs.map((pdf, index) => {
                  const progress = pdf.progress || 0;
                  const status =
                    progress === 0
                      ? 'NOT_STARTED'
                      : progress === 100
                      ? 'COMPLETED'
                      : 'IN_PROGRESS';
                  const statusColor =
                    status === 'COMPLETED'
                      ? 'text-green-400'
                      : status === 'IN_PROGRESS'
                      ? 'text-yellow-400'
                      : 'text-gray-400';

                  return (
                    <motion.tr
                      key={pdf._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-green-500/10 hover:bg-green-500/5 cursor-pointer"
                      onClick={() => navigate(`/viewer/${pdf._id}`)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FaFilePdf className="text-red-500" />
                          <span className="text-green-400">{pdf.title}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={statusColor}>
                          &gt; {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-green-500/20 border border-green-500/30 h-2">
                            <div
                              className="bg-green-400 h-full"
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                          <span className="text-green-400 text-sm">{Math.round(progress)}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-green-400/70">
                        {pdf.currentPage || 1} / {pdf.totalPage || 'N/A'}
                      </td>
                      <td className="p-4 text-green-400/70 text-sm">
                        {formatDate(pdf.lastAccessed)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(e, pdf._id);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-20 border border-green-500/30 bg-green-500/5">
              <FaFilePdf className="text-8xl text-green-500/20 mx-auto mb-4" />
              <p className="text-green-400/50">&gt; No PDFs found</p>
            </div>
          )
        )}

        {loading && (
          <div className="text-center py-20">
            <FaSpinner className="text-4xl text-green-400 animate-spin mx-auto mb-4" />
            <p className="text-green-400/70">&gt; Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardDev;

