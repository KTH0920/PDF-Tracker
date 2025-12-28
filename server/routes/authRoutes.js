import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Google 로그인 처리 (Authorization Code를 ID Token으로 교환)
router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code가 필요합니다.' });
    }

    // 환경 변수 확인
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // redirectUri 끝의 슬래시 제거 (Google OAuth는 정확한 URI 매칭을 요구함)
    const redirectUri = (process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173').replace(/\/$/, '');

    if (!clientId || !clientSecret) {
      console.error('환경 변수 확인:', {
        GOOGLE_CLIENT_ID: clientId ? '설정됨' : '누락',
        GOOGLE_CLIENT_SECRET: clientSecret ? '설정됨' : '누락',
      });
      throw new Error('GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET이 설정되지 않았습니다. .env 파일을 확인하세요.');
    }

    // OAuth2Client를 요청마다 새로 생성 (환경 변수가 최신인지 확인)
    const client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    // Authorization Code를 Access Token과 ID Token으로 교환
    const { tokens } = await client.getToken(code);
    
    if (!tokens.id_token) {
      throw new Error('ID Token을 받을 수 없습니다.');
    }

    // ID Token 검증 (Client Secret을 사용하여 안전하게 검증)
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('토큰 페이로드를 가져올 수 없습니다.');
    }

    const { sub: userId, email, name, picture } = payload;

    // 사용자 정보를 DB에 저장 또는 업데이트
    let user = await User.findOne({ userId });
    
    if (user) {
      // 기존 사용자: 정보 업데이트 및 마지막 로그인 시간 갱신
      user.email = email;
      user.name = name;
      user.picture = picture;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // 신규 사용자: 새로 생성
      user = new User({
        userId,
        email,
        name,
        picture,
        lastLogin: new Date(),
      });
      await user.save();
    }

    // JWT 토큰 생성
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET이 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    const jwtToken = jwt.sign(
      { userId, email, name },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        uid: userId, // Firebase와 호환성을 위해 uid로
        email,
        name,
        picture,
      },
    });
  } catch (error) {
    console.error('인증 에러:', error);
    console.error('에러 스택:', error.stack);
    
    // 환경 변수 확인
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasJwtSecret = !!process.env.JWT_SECRET;
    
    console.error('환경 변수 상태:', {
      GOOGLE_CLIENT_ID: hasClientId ? '설정됨' : '누락',
      GOOGLE_CLIENT_SECRET: hasClientSecret ? '설정됨' : '누락',
      JWT_SECRET: hasJwtSecret ? '설정됨' : '누락',
    });
    
    res.status(401).json({ 
      error: '인증 실패', 
      details: error.message,
      // 개발 환경에서만 상세 정보 제공
      ...(process.env.NODE_ENV !== 'production' && {
        stack: error.stack,
        envStatus: {
          hasClientId,
          hasClientSecret,
          hasJwtSecret,
        }
      })
    });
  }
});

export default router;

