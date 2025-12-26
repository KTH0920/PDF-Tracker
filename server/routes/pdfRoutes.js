import express from 'express';
import upload from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import UserPDF from '../models/UserPDF.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// ES 모듈에서 __dirname 사용하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// PDF 파일 업로드
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF 파일이 필요합니다.' });
    }

    // 인증된 사용자의 ID 사용
    const userId = req.user.userId;

    // filePath는 파일명을 URL 인코딩하여 저장 (한글 파일명 지원)
    // 실제 파일은 원본 파일명으로 저장되지만, URL 접근 시에는 인코딩 필요
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    const filePath = `${SERVER_URL}/uploads/${encodeURIComponent(req.file.filename)}`;
    const fileTitle = req.body.title || req.file.originalname;

    // PDF 페이지 수 계산
    let totalPage = 0;
    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      // pdf-parse 1.1.1 버전은 함수로 export됨
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(dataBuffer);
      totalPage = data.numpages;
    } catch (error) {
      console.error('PDF 페이지 수 계산 실패:', error);
      console.error('에러 상세:', error.message);
    }

    // DB에 저장
    const userPDF = new UserPDF({
      userId: userId,
      title: fileTitle,
      filePath: filePath,
      totalPage: totalPage,
      currentPage: 1,
      progress: 0,
      lastAccessed: new Date(),
    });

    await userPDF.save();

    res.status(201).json({
      message: '파일 업로드 성공',
      pdf: userPDF,
    });
  } catch (error) {
    console.error('업로드 에러:', error);
    res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다.' });
  }
});

// 특정 유저의 PDF 목록 조회 (현재 로그인한 사용자의 목록만 조회)
router.get('/list', async (req, res) => {
  try {
    const userId = req.user.userId;

    const pdfs = await UserPDF.find({ userId }).sort({ lastAccessed: -1 });

    res.json({
      success: true,
      count: pdfs.length,
      pdfs: pdfs,
    });
  } catch (error) {
    console.error('목록 조회 에러:', error);
    res.status(500).json({ error: 'PDF 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 모든 PDF 조회 (테스트용 - 모든 데이터 확인)
router.get('/all', async (req, res) => {
  try {
    const pdfs = await UserPDF.find({}).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: pdfs.length,
      database: mongoose.connection.db?.databaseName || 'pdf-tracker',
      collection: 'userpdfs',
      pdfs: pdfs,
    });
  } catch (error) {
    console.error('전체 조회 에러:', error);
    res.status(500).json({ error: 'PDF 목록 조회 중 오류가 발생했습니다.' });
  }
});

// PDF 삭제
router.delete('/:pdfId', async (req, res) => {
  try {
    const { pdfId } = req.params;

    const pdf = await UserPDF.findById(pdfId);
    if (!pdf) {
      return res.status(404).json({ error: 'PDF를 찾을 수 없습니다.' });
    }

    // 파일 경로에서 실제 파일명 추출
    const fileUrl = pdf.filePath;
    const fileName = decodeURIComponent(fileUrl.split('/').pop());
    const filePath = path.join(__dirname, '../uploads', fileName);

    // DB에서 삭제
    await UserPDF.findByIdAndDelete(pdfId);

    // 실제 파일 삭제
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('파일 삭제 실패 (DB는 삭제됨):', fileError.message);
    }

    res.json({
      success: true,
      message: 'PDF가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('PDF 삭제 에러:', error);
    res.status(500).json({ error: 'PDF 삭제 중 오류가 발생했습니다.' });
  }
});

// 진행률 업데이트
router.put('/progress', async (req, res) => {
  try {
    const { pdfId, currentPage, progress } = req.body;

    if (!pdfId) {
      return res.status(400).json({ error: 'pdfId가 필요합니다.' });
    }

    const updateData = {
      lastAccessed: new Date(),
    };

    if (currentPage !== undefined) {
      updateData.currentPage = currentPage;
    }

    if (progress !== undefined) {
      updateData.progress = Math.max(0, Math.min(100, progress));
    }

    const updatedPDF = await UserPDF.findByIdAndUpdate(
      pdfId,
      updateData,
      { new: true }
    );

    if (!updatedPDF) {
      return res.status(404).json({ error: 'PDF를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      pdf: updatedPDF,
    });
  } catch (error) {
    console.error('진행률 업데이트 에러:', error);
    res.status(500).json({ error: '진행률 업데이트 중 오류가 발생했습니다.' });
  }
});

export default router;

