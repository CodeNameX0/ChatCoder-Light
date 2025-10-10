// Cloudflare Pages Functions - API 엔드포인트
// MongoDB Atlas Data API를 사용한 백엔드 API

import { CloudflareDatabase } from '../../cloudflare-database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// JWT 검증 함수
function verifyToken(token, jwtSecret) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.path.join('/');

  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const db = new CloudflareDatabase(env);
    
    // API 라우팅
    switch (path) {
      case 'auth/signup':
        return await handleSignup(request, db, env);
      
      case 'auth/login':
        return await handleLogin(request, db, env);
      
      case 'auth/verify':
        return await handleVerifyToken(request, env);
      
      case 'messages':
        return await handleMessages(request, db, env);
      
      case 'test':
        return await handleTest(db);
      
      default:
        return new Response(JSON.stringify({ error: 'API 엔드포인트를 찾을 수 없습니다' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
  } catch (error) {
    console.error('API 오류:', error);
    return new Response(JSON.stringify({ 
      error: '서버 오류가 발생했습니다',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// 회원가입 처리
async function handleSignup(request, db, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST 메서드만 허용됩니다' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const { username, password, token } = await request.json();
  
  // 토큰 검증
  if (token !== env.SIGNUP_TOKEN) {
    return new Response(JSON.stringify({ error: '잘못된 가입 토큰입니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // 기존 사용자 확인
  const existingUser = await db.findUser(username);
  if (existingUser) {
    return new Response(JSON.stringify({ error: '이미 존재하는 사용자입니다' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // 비밀번호 해시화
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 사용자 생성
  await db.createUser(username, hashedPassword);
  
  return new Response(JSON.stringify({ message: '회원가입이 완료되었습니다' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// 로그인 처리
async function handleLogin(request, db, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST 메서드만 허용됩니다' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const { username, password, token } = await request.json();
  
  // 토큰 검증
  if (token !== env.SIGNUP_TOKEN) {
    return new Response(JSON.stringify({ error: '잘못된 로그인 토큰입니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // 사용자 찾기
  const user = await db.findUser(username);
  if (!user) {
    return new Response(JSON.stringify({ error: '사용자를 찾을 수 없습니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // 비밀번호 검증
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return new Response(JSON.stringify({ error: '잘못된 비밀번호입니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // JWT 토큰 생성
  const jwtToken = jwt.sign(
    { username: user.username },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return new Response(JSON.stringify({ 
    token: jwtToken, 
    username: user.username 
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// 토큰 검증 처리
async function handleVerifyToken(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST 메서드만 허용됩니다' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const { token } = await request.json();
  const decoded = verifyToken(token, env.JWT_SECRET);
  
  if (!decoded) {
    return new Response(JSON.stringify({ valid: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({ 
    valid: true, 
    username: decoded.username 
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// 메시지 처리
async function handleMessages(request, db, env) {
  if (request.method === 'GET') {
    // 메시지 조회
    const messages = await db.getRecentMessages(50);
    return new Response(JSON.stringify({ messages }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  if (request.method === 'POST') {
    // 메시지 저장
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token, env.JWT_SECRET);
    
    if (!decoded) {
      return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { content } = await request.json();
    await db.saveMessage(decoded.username, content);
    
    return new Response(JSON.stringify({ message: '메시지가 저장되었습니다' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({ error: '지원하지 않는 메서드입니다' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// 연결 테스트
async function handleTest(db) {
  const isConnected = await db.testConnection();
  
  return new Response(JSON.stringify({ 
    status: 'OK',
    database: isConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
