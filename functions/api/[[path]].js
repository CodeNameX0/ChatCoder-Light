// Cloudflare Pages Functions
// 이 파일은 Cloudflare Pages에서 서버 사이드 기능을 제공합니다.

export async function onRequest(context) {
  const { request, env } = context;
  
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

  // 기본 응답
  return new Response('Cloudflare Pages Functions is working!', {
    headers: {
      'Content-Type': 'text/plain',
      ...corsHeaders,
    },
  });
}
