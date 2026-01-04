# Node.js LTS Alpine 기반 이미지
FROM node:lts-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (프로덕션만)
RUN npm ci --only=production

# 애플리케이션 소스 복사
COPY . .

# 업로드 디렉토리 생성 (없을 경우를 대비)
RUN mkdir -p /app/uploads

# 포트 노출
EXPOSE 5000

# 서버 실행
CMD ["node", "index.js"]

