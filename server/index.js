import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import pdfRoutes from './routes/pdfRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { MONGO_URI } from './secrets.js';

// ES 모듈에서 __dirname 사용하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors()); // 모든 요청 허용
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 데이터 파싱

// 정적 파일 제공 (uploads 폴더) - CORS 헤더 추가 및 파일명 디코딩
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // URL 인코딩된 파일명 디코딩
  if (req.url) {
    try {
      const decodedUrl = decodeURIComponent(req.url);
      req.url = decodedUrl;
    } catch (e) {
      // 디코딩 실패 시 원본 사용
    }
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // PDF 파일에 대한 Content-Type 설정
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
  }
}));

// MongoDB 연결
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
  }
};

connectDB();

// 라우트 연결
app.use('/api/pdf', pdfRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'PDF Focus Tracker API 서버가 실행 중입니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

