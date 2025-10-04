// 런타임 설정: Cloudflare Pages 등 외부 배포 시 백엔드 주소 지정
// 기본값은 같은 오리진(로컬 개발)으로 동작합니다.
window.APP_CONFIG = {
  // 예: 'https://api.example.com' 또는 'https://chatcoder-backend.yourdomain.com'
  API_BASE: '',
  // 예: 'https://api.example.com' (Socket.IO 서버의 URL). 비우면 같은 오리진 사용
  SOCKET_URL: ''
};
