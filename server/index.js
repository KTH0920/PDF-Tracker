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
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors()); // 모든 요청 허용
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 데이터 파싱

// 정적 파일 제공 (uploads 폴더)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB 연결
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-tracker';
    
    // MongoDB Atlas 연결 문자열에 데이터베이스 이름이 없으면 추가
    if (mongoURI.includes('mongodb+srv://') && !mongoURI.match(/\/[^/?]+(\?|$)/)) {
      // 데이터베이스 이름이 없으면 /pdf-tracker 추가
      mongoURI = mongoURI.replace(/\?/, '/pdf-tracker?') || mongoURI + '/pdf-tracker';
    }
    
    console.log('🔗 MongoDB 연결 시도 중...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    console.log('⚠️  MongoDB가 실행되지 않았거나 연결 정보가 올바르지 않습니다.');
    console.log('💡 서버는 계속 실행되지만 데이터베이스 기능은 사용할 수 없습니다.');
    console.log('💡 MongoDB Atlas의 경우 네트워크 접근 설정(IP 화이트리스트)을 확인해주세요.');
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
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

