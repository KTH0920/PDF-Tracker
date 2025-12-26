import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Google OAuth 클라이언트 초기화
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google 로그인 처리
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: '토큰이 필요합니다.' });
    }

    // Google Access Token을 사용하여 사용자 정보 가져오기
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('사용자 정보 가져오기 실패');
    }

    const userInfo = await response.json();
    const { id: userId, email, name, picture } = userInfo;

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
    res.status(401).json({ error: '인증 실패', details: error.message });
  }
});

export default router;

