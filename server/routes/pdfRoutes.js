import express from 'express';
import upload from '../middleware/upload.js';
import UserPDF from '../models/UserPDF.js';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// PDF 파일 업로드
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF 파일이 필요합니다.' });
    }

    if (!req.body.userId) {
      return res.status(400).json({ error: 'userId가 필요합니다.' });
    }

    const filePath = `http://localhost:5000/uploads/${req.file.filename}`;
    const fileTitle = req.body.title || req.file.originalname;

    // PDF 페이지 수 계산
    let totalPage = 0;
    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdf(dataBuffer);
      totalPage = data.numpages;
    } catch (error) {
      console.error('PDF 페이지 수 계산 실패:', error);
    }

    // DB에 저장
    const userPDF = new UserPDF({
      userId: req.body.userId,
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

// 특정 유저의 PDF 목록 조회
router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

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

