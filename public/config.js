// 런타임 설정: Cloudflare Pages 등 외부 배포 시 백엔드 주소 지정
// 프로덕션 환경에서는 별도 백엔드 서버 URL을 설정해야 합니다.
window.APP_CONFIG = {
  // API 서버 주소 (백엔드 서버)
  API_BASE: location.hostname === 'localhost' || location.hostname === '127.0.0.1' 
    ? '' 
    : 'https://chatcoder-backend-api.code-nex.store',
  
  // Socket.IO 서버 주소 (실시간 통신용)
  SOCKET_URL: location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? ''
    : 'https://chatcoder-backend-api.code-nex.store'
};
