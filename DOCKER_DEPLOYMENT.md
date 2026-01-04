# Docker Compose 배포 가이드

## 📋 사전 요구사항

- Docker 및 Docker Compose 설치
- 호스트에 `/home/kth/pdf-data` 디렉토리 존재 (또는 원하는 경로로 수정)

## 🚀 빠른 시작

### 1. 환경 변수 설정 (선택사항)

프로젝트 루트에 `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요:

```env
# MongoDB 설정
MONGO_URI=mongodb://localhost:27017/pdf-tracker

# JWT Secret (보안을 위해 반드시 변경하세요)
JWT_SECRET=your-secret-key-here

# Server URL
SERVER_URL=http://localhost:5000
```

### 2. Docker Compose로 빌드 및 실행

```bash
# 프로젝트 루트에서 실행
docker-compose up -d --build
```

### 3. 서비스 확인

```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f server
docker-compose logs -f client
```

### 4. 서비스 중지

```bash
# 서비스 중지 (컨테이너 유지)
docker-compose stop

# 서비스 중지 및 컨테이너 제거
docker-compose down

# 볼륨까지 제거하려면
docker-compose down -v
```

## 📁 서비스 구성

### Server (Backend)
- **포트**: `5000:5000`
- **Volume**: `/home/kth/pdf-data:/app/uploads`
- **환경변수**: `UPLOAD_DIR=/app/uploads`

### Client (Frontend)
- **포트**: `5173:80` (외부 5173포트 → 내부 Nginx 80포트)
- **의존성**: `server` 서비스가 먼저 시작되어야 함

## 🔧 주요 설정

### Volume 마운트 변경

`docker-compose.yml`의 `server` 서비스에서 Volume 경로를 수정:

```yaml
volumes:
  - /your/host/path:/app/uploads
```

### 포트 변경

**Client 포트 변경:**
```yaml
ports:
  - "원하는포트:80"
```

**Server 포트 변경:**
```yaml
ports:
  - "원하는포트:5000"
```

그리고 `server/index.js`의 기본 포트도 함께 수정해야 합니다.

### 환경 변수 변경

`docker-compose.yml`의 `environment` 섹션을 수정하거나 `.env` 파일 사용:

```yaml
env_file:
  - .env
```

## 🐛 문제 해결

### 컨테이너가 시작되지 않는 경우

```bash
# 로그 확인
docker-compose logs server
docker-compose logs client

# 컨테이너 상태 확인
docker-compose ps

# 재빌드
docker-compose up -d --build --force-recreate
```

### Volume 마운트 문제

```bash
# 호스트 디렉토리 권한 확인
ls -la /home/kth/pdf-data

# 필요시 권한 부여
sudo chmod 755 /home/kth/pdf-data
sudo chown $USER:$USER /home/kth/pdf-data
```

### 포트 충돌

다른 서비스가 포트를 사용 중인 경우:
1. `docker-compose.yml`에서 포트 변경
2. 또는 기존 서비스 중지

### Client에서 API 호출 실패

`client/src/api.js`에서 API URL이 올바른지 확인:
- 개발 환경: `http://localhost:5000`
- 프로덕션: 서버의 실제 URL

필요시 `nginx.conf`의 주석 처리된 프록시 설정을 활성화할 수 있습니다.

## 📚 추가 정보

### 이미지 재빌드

```bash
# 특정 서비스만 재빌드
docker-compose build server
docker-compose build client

# 캐시 없이 재빌드
docker-compose build --no-cache
```

### 컨테이너 내부 접속

```bash
# Server 컨테이너 접속
docker-compose exec server sh

# Client 컨테이너 접속
docker-compose exec client sh
```

### 볼륨 확인

```bash
# 마운트된 볼륨 확인
docker-compose exec server ls -la /app/uploads
```

## 🌐 접속 URL

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

Nginx Proxy Manager를 사용하는 경우, Client 서비스의 80포트를 프록시로 연결하세요.

