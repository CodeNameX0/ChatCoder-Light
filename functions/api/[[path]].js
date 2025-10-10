// Cloudflare Pages Functions - API Handler with KV Database
// Socket.IO 대신 polling 방식으로 실시간 채팅 구현

export async function onRequest(context) {
  const { request, env, params } = context;
  
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(request.url);
    const path = params.path ? params.path.join('/') : '';

    // JWT 검증 함수
    const verifyToken = (token) => {
      try {
        if (!token || !token.includes('.')) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch {
        return null;
      }
    };

    // 라우팅 처리
    switch (path) {
      case 'auth/signup':
        if (request.method === 'POST') {
          const { username, password, token } = await request.json();
          
          if (token !== 'chat-all-us1') {
            return new Response(JSON.stringify({ error: '올바르지 않은 토큰입니다' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          try {
            // 중복 체크
            const existingUser = await env.CHAT_KV.get(`user:${username}`);
            if (existingUser) {
              return new Response(JSON.stringify({ error: '이미 존재하는 사용자명입니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }

            // 사용자 생성
            const user = {
              username,
              password: btoa(password), // 간단한 인코딩 (데모용)
              createdAt: new Date().toISOString()
            };

            await env.CHAT_KV.put(`user:${username}`, JSON.stringify(user));
            
            // JWT 토큰 생성
            const jwtPayload = { username, iat: Date.now() };
            const jwtToken = `header.${btoa(JSON.stringify(jwtPayload))}.signature`;

            return new Response(JSON.stringify({ 
              message: '회원가입이 완료되었습니다', 
              token: jwtToken,
              user: { username }
            }), {
              status: 201,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } catch (error) {
            return new Response(JSON.stringify({ error: '회원가입 처리 중 오류가 발생했습니다' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }
        break;

      case 'auth/login':
        if (request.method === 'POST') {
          const { username, password, token } = await request.json();
          
          if (token !== 'chat-all-us1') {
            return new Response(JSON.stringify({ error: '올바르지 않은 토큰입니다' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          try {
            const userData = await env.CHAT_KV.get(`user:${username}`);
            
            if (!userData) {
              return new Response(JSON.stringify({ error: '사용자를 찾을 수 없습니다' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }

            const user = JSON.parse(userData);
            if (user.password !== btoa(password)) {
              return new Response(JSON.stringify({ error: '잘못된 비밀번호입니다' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }

            // JWT 토큰 생성
            const jwtPayload = { username, iat: Date.now() };
            const jwtToken = `header.${btoa(JSON.stringify(jwtPayload))}.signature`;

            return new Response(JSON.stringify({ 
              message: '로그인 성공', 
              token: jwtToken,
              user: { username }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } catch (error) {
            return new Response(JSON.stringify({ error: '로그인 처리 중 오류가 발생했습니다' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }
        break;

      case 'messages':
        const authHeader = request.headers.get('authorization');
        const authToken = authHeader?.split(' ')[1];
        const userPayload = verifyToken(authToken);

        if (request.method === 'GET') {
          try {
            // 최근 메시지 조회
            const messagesData = await env.CHAT_KV.get('messages:recent');
            const messages = messagesData ? JSON.parse(messagesData) : [];
            
            return new Response(JSON.stringify({ messages }), {
              status: 200,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } catch (error) {
            return new Response(JSON.stringify({ error: '메시지 조회 실패' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        } else if (request.method === 'POST') {
          if (!userPayload) {
            return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          try {
            const { content } = await request.json();
            
            // 새 메시지 생성
            const message = {
              id: Date.now(),
              username: userPayload.username,
              content,
              timestamp: new Date().toISOString()
            };

            // 기존 메시지 조회 및 업데이트
            const messagesData = await env.CHAT_KV.get('messages:recent');
            const messages = messagesData ? JSON.parse(messagesData) : [];
            
            messages.push(message);
            
            // 최대 50개 메시지만 유지
            if (messages.length > 50) {
              messages.shift();
            }

            await env.CHAT_KV.put('messages:recent', JSON.stringify(messages));

            return new Response(JSON.stringify({ message, success: true }), {
              status: 201,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } catch (error) {
            return new Response(JSON.stringify({ error: '메시지 전송 실패' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }
        break;

      case 'status':
        return new Response(JSON.stringify({ 
          status: 'online',
          message: 'ChatCoder Light API is running on Cloudflare Pages',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      default:
        return new Response(JSON.stringify({ error: 'API 엔드포인트를 찾을 수 없습니다' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
