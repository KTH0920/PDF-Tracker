import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import pdfRoutes from './routes/pdfRoutes.js';
import authRoutes from './routes/authRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateEnvVars } from './utils/env.js';

// 환경 변수 로드
dotenv.config();

// ES 모듈에서 __dirname 사용하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-tracker';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// 환경 변수 검증 (프로덕션 환경에서만)
if (process.env.NODE_ENV === 'production') {
  try {
    validateEnvVars(['MONGO_URI', 'JWT_SECRET']);
  } catch (error) {
    console.error('❌ 환경 변수 검증 실패:', error.message);
    process.exit(1);
  }
}

// 미들웨어 설정
app.use(cors()); // 모든 요청 허용
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 데이터 파싱

// 정적 파일 제공 (uploads 폴더) - CORS 헤더 추가 및 파일명 디코딩
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
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
}, express.static(path.resolve(UPLOAD_DIR), {
  setHeaders: (res, filePath) => {
    // PDF 파일에 대한 Content-Type 및 CORS 헤더 설정
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Access-Control-Allow-Origin', '*');
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
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'PDF Focus Tracker API 서버가 실행 중입니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

