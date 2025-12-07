# PDF Focus Tracker

PDF 파일을 관리하고 추적하는 풀스택 애플리케이션입니다.

## 기술 스택

### Frontend
- **React** (Vite)
- **Tailwind CSS** - 스타일링
- **react-pdf** - PDF 뷰어
- **Firebase** - 인증
- **Axios** - HTTP 클라이언트
- **React Router DOM** - 라우팅
- **React Icons** - 아이콘

### Backend
- **Node.js** + **Express** - 서버 프레임워크
- **MongoDB** + **Mongoose** - 데이터베이스
- **Multer** - 파일 업로드 처리
- **CORS** - Cross-Origin 리소스 공유
- **dotenv** - 환경 변수 관리

## 프로젝트 구조

```
PDF-Tracker/
├── client/          # React 프론트엔드
├── server/          # Node.js 백엔드
│   └── uploads/     # PDF 파일 저장 폴더
└── README.md
```

## 시작하기

### Prerequisites
- Node.js (v16 이상)
- MongoDB (로컬 또는 클라우드)

### 설치

1. 클라이언트 의존성 설치:
```bash
cd client
npm install
```

2. 서버 의존성 설치:
```bash
cd server
npm install
```

### 실행

1. MongoDB 서버 실행

2. 서버 실행:
```bash
cd server
npm run dev
```

3. 클라이언트 실행:
```bash
cd client
npm run dev
```

## 주요 기능

- PDF 파일 업로드 및 로컬 서버 저장
- Firebase를 통한 사용자 인증
- PDF 파일 관리 및 추적
- PDF 뷰어를 통한 파일 미리보기

## 라이선스

MIT
