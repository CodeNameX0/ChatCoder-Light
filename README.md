# ChatCoder Light

간단하고 가벼운 단체 채팅 웹앱입니다. JWT 인증, Socket.IO 실시간 메시징, MongoDB Atlas 저장소를 사용하며 PWA(설치형 웹앱)를 지원합니다.

- 이름: ChatCoder Light
- 제작자: CodeNameX0
- 개발 날짜: 2025.10.4

## 기능
- 회원가입/로그인 (아이디/비번) + 고정 접속 토큰(`chat-all-us1`)
- 단일 공개 채팅방
- MongoDB Atlas 영속 저장 (사용자/메시지)
- Socket.IO 실시간 통신
- PWA 지원(오프라인 캐시, 홈 화면 설치)

## 빠른 시작
1) 의존성 설치
```
npm install
```

2) 환경변수 설정
`.env` 파일을 만들고 아래 값을 채워주세요(`.env.example` 참고).
```
MONGODB_URI=your-atlas-uri
JWT_SECRET=your-secret-key
PORT=3000
```

3) 개발 서버 실행
```
npm run dev
```
또는 프로덕션 실행:
```
npm start
```

브라우저에서 http://localhost:3000 에 접속하세요.

## PWA 설치
- 데스크톱 Chrome/Edge: 주소창의 설치 아이콘 또는 앱 내 설치 버튼 사용
- iOS Safari: 공유 > 홈 화면에 추가

## 프로젝트 구조
- `server.js`: Express + Socket.IO 서버, API 라우트
- `database.js`: Mongoose 연결 및 모델 CRUD 래퍼
- `public/`: 정적 자산(HTML/CSS/JS, SW, manifest, icons)

## 보안
- `.env`는 Git에 커밋하지 마세요. Atlas URI, JWT 비밀값 등은 환경변수로 관리합니다.

## 라이선스
MIT

## Cloudflare Pages 배포 가이드

프런트엔드(정적 파일)를 Cloudflare Pages로 배포하고, 백엔드는 별도 서버(예: Render, Railway, Cloudflare Workers/Pages Functions)로 운영할 수 있습니다.

### 1) 리포지토리 연결
- Cloudflare Dashboard > Pages > Create a project > Connect to Git
- GitHub에서 `CodeNameX0/ChatCoder-Light` 선택

### 2) 빌드 설정
- Framework preset: None
- Build command: 비워두기
- Build output directory: `public`

### 3) 환경 변수
- Pages는 정적 호스팅이므로 프런트가 사용할 API/SOCKET 주소를 런타임 구성으로 전달합니다.
- `public/config.js`에서 `API_BASE`와 `SOCKET_URL`을 배포 도메인에 맞게 설정하세요.
	- 예: `API_BASE: 'https://your-backend.example.com'`
	- 예: `SOCKET_URL: 'https://your-backend.example.com'`

### 4) 백엔드 배포
- 현재 서버(`server.js`)는 Node.js + Express + Socket.IO입니다.
- Render/Railway 등에 배포 후, 프론트의 `config.js`에 해당 백엔드 URL을 입력합니다.
- 서버의 CORS 설정은 기본 허용으로 설정되어 있습니다. 운영 시 필요한 도메인만 허용하도록 제한하는 것을 권장합니다.

### 5) 서비스 워커/캐시 주의
- `sw.js`는 `config.js`를 캐시합니다. 설정 변경 후에는 페이지 강력 새로고침(Ctrl+F5)으로 갱신하세요.
