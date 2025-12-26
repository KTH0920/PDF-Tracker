import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

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
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173';

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

    // JWT 토큰 생성
    const jwtToken = jwt.sign(
      { userId, email, name },
      process.env.JWT_SECRET,
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
    res.status(401).json({ 
      error: '인증 실패', 
      details: error.message 
    });
  }
});

export default router;

