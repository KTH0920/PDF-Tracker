import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import pdfRoutes from './routes/pdfRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 사용하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors()); // 모든 요청 허용
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 데이터 파싱

// 정적 파일 제공 (uploads 폴더)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB 연결 성공');
  })
  .catch((error) => {
    console.error('MongoDB 연결 실패:', error);
  });

// 라우트 연결
app.use('/api/pdf', pdfRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'PDF Focus Tracker API 서버가 실행 중입니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

