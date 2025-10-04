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
