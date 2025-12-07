import multer from 'multer';
import path from 'path';

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
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

