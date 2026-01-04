import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 업로드 디렉토리 설정 (환경변수 또는 기본값)
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// 업로드 디렉토리가 없으면 생성
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`📁 업로드 디렉토리 생성: ${UPLOAD_DIR}`);
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // 파일명 중복 방지: Date.now() + '-' + 원본 파일명
    const uniqueFileName = Date.now() + '-' + file.originalname;
    cb(null, uniqueFileName);
  },
});

// 파일 필터 (PDF만 허용)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('PDF 파일만 업로드 가능합니다.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 제한
  },
});

export default upload;

