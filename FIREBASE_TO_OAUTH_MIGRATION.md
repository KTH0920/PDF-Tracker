# Firebase에서 Google OAuth로 마이그레이션 가이드

## ✅ 완료된 작업

코드가 Firebase에서 Google OAuth 직접 사용으로 변경되었습니다.

## 📋 준비해야 할 사항

### 1. Google Cloud Console 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - Google 계정으로 로그인

2. **프로젝트 생성**
   - 상단 프로젝트 선택 드롭다운 클릭
   - "새 프로젝트" 클릭
   - 프로젝트 이름 입력 (예: "PDF Tracker")
   - 생성 버튼 클릭

3. **OAuth 동의 화면 구성**
   - 좌측 메뉴에서 "API 및 서비스" > "OAuth 동의 화면" 선택
   - 사용자 유형 선택: 외부 (또는 내부)
   - 앱 정보 입력:
     - 앱 이름: PDF Focus Tracker
     - 사용자 지원 이메일: 본인 이메일
     - 앱 로고 (선택사항)
   - 저장 후 계속

4. **스코프 추가** (선택사항)
   - 필요한 경우 스코프 추가 (기본적으로 email, profile, openid는 자동 포함)

5. **테스트 사용자 추가** (앱이 "테스트" 상태인 경우)
   - 테스트 사용자 섹션에서 본인 이메일 추가

6. **OAuth 2.0 클라이언트 ID 생성**
   - 좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택
   - 상단 "+ 사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
   - 애플리케이션 유형: 웹 애플리케이션
   - 이름: PDF Tracker Web Client
   - 승인된 JavaScript 원본 추가:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
     (프론트엔드 실행 포트에 맞게 설정)
   - 승인된 리디렉션 URI 추가:
     ```
     http://localhost:5173
     http://localhost:3000
     ```
     (프로덕션 환경이 있다면 해당 도메인도 추가)
   - 만들기 버튼 클릭
   - **클라이언트 ID 복사** (나중에 .env 파일에 사용)

### 2. 환경 변수 설정

#### 서버 (server/.env 파일 생성)

```env
# MongoDB 연결 문자열
MONGO_URI=mongodb://localhost:27017/pdf-tracker

# 서버 포트
PORT=5000

# 서버 URL
SERVER_URL=http://localhost:5000

# Google OAuth Client ID (위에서 복사한 값)
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com

# JWT Secret (랜덤한 강력한 문자열 생성)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**JWT_SECRET 생성 방법:**
```bash
# Node.js에서:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 또는 온라인 랜덤 문자열 생성기 사용
```

#### 클라이언트 (client/.env 파일 생성)

```env
# API 서버 URL
VITE_API_URL=http://localhost:5000

# Google OAuth Client ID (서버와 동일한 값)
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

### 3. Firebase 패키지 제거 (선택사항)

Firebase를 더 이상 사용하지 않으므로 제거할 수 있습니다:

```bash
cd client
npm uninstall firebase
```

또는 그대로 두어도 무방합니다 (다른 곳에서 사용하지 않는다면).

### 4. firebase.js 파일 제거 (선택사항)

`client/src/firebase.js` 파일은 더 이상 사용되지 않으므로 삭제할 수 있습니다.

## 🔄 주요 변경 사항

### 백엔드
- ✅ `server/routes/authRoutes.js` - Google OAuth 인증 라우트 추가
- ✅ `server/middleware/auth.js` - JWT 토큰 검증 미들웨어 추가
- ✅ `server/routes/pdfRoutes.js` - 모든 라우트에 인증 미들웨어 적용
- ✅ `server/index.js` - 인증 라우트 연결

### 프론트엔드
- ✅ `client/src/auth.js` - 인증 유틸리티 함수 (Firebase 대체)
- ✅ `client/src/main.jsx` - GoogleOAuthProvider 추가
- ✅ `client/src/pages/Login.jsx` - Firebase 대신 @react-oauth/google 사용
- ✅ `client/src/App.jsx` - localStorage 기반 인증 상태 관리
- ✅ `client/src/pages/Dashboard.jsx` - Firebase 제거, 새 인증 방식 사용
- ✅ `client/src/pages/Viewer.jsx` - Firebase 제거, 새 인증 방식 사용
- ✅ `client/src/api.js` - JWT 토큰 인터셉터 추가

## 🧪 테스트 방법

1. **서버 실행**
   ```bash
   cd server
   npm start
   ```

2. **클라이언트 실행**
   ```bash
   cd client
   npm run dev
   ```

3. **로그인 테스트**
   - 브라우저에서 http://localhost:5173 접속
   - "Google로 로그인" 버튼 클릭
   - Google 계정 선택 및 승인
   - 대시보드로 리디렉션되는지 확인

## ⚠️ 주의사항

1. **보안**
   - JWT_SECRET은 반드시 강력한 랜덤 문자열로 설정하세요
   - 프로덕션 환경에서는 환경 변수를 안전하게 관리하세요
   - .env 파일은 절대 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)

2. **프로덕션 배포 시**
   - Google Cloud Console에서 승인된 JavaScript 원본 및 리디렉션 URI에 프로덕션 도메인 추가
   - HTTPS 사용 필수
   - 환경 변수를 배포 환경에 맞게 설정

3. **기존 사용자 데이터**
   - Firebase의 user.uid와 Google의 user ID(sub)가 다를 수 있습니다
   - 기존 데이터가 있다면 마이그레이션 스크립트가 필요할 수 있습니다

## 📚 참고 자료

- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google 문서](https://github.com/MomenSherif/react-oauth)

