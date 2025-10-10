# Cloudflare Pages 배포 가이드 (KV Database 버전)

## 🚀 개요

이 프로젝트는 Cloudflare Pages + KV Database를 사용하여 완전한 서버리스 채팅 애플리케이션으로 구현되었습니다.
MongoDB 연결 문제를 해결하기 위해 Cloudflare KV를 사용하여 데이터 저장을 처리합니다.

## 1. Cloudflare Pages 설정

### 배포 설정:
- **프레임워크 프리셋**: None
- **빌드 명령**: `npm run build`
- **빌드 출력 디렉터리**: `public`
- **루트 디렉터리**: `/`

### KV Namespace 생성:
Cloudflare Dashboard에서 다음 KV Namespace를 생성해야 합니다:

1. **Workers & Pages** > **KV** > **Create namespace**
2. Namespace 이름: `CHAT_KV`
3. 생성된 Namespace ID를 `wrangler.toml`에 설정

### 환경 변수:
Pages 프로젝트 설정에서 다음 KV binding을 설정:

```
CHAT_KV (KV Namespace)
```

## 2. 파일 구조

```
public/
├── index-cloudflare.html    # Cloudflare 전용 HTML
├── client-cloudflare.js     # Polling 기반 클라이언트
├── config.js               # 환경별 API 설정
└── styles.css             # 스타일 (Cloudflare 스타일 포함)

functions/
└── api/
    └── [[path]].js        # API Functions (KV Database 사용)
```

## 3. 도메인 연결 (code-nex.store)

### Cloudflare에서:
1. Pages 프로젝트 > **Custom domains** 탭
2. **Add custom domain** 클릭
3. `code-nex.store` 및 `www.code-nex.store` 입력
4. DNS 레코드 정보 확인

### 가비아에서:
1. **도메인 관리** > **DNS 설정**
2. 다음 레코드 추가:
   ```
   타입: A
   호스트: @
   값: [Cloudflare Pages IP]
   
   타입: CNAME
   호스트: www
   값: [프로젝트명].pages.dev
   ```

## 4. 배포 과정

### 단계 1: GitHub 연결
1. Cloudflare Dashboard > Pages > **Create a project**
2. **Connect to Git** > GitHub 선택
3. `ChatCoder-Light` 리포지토리 선택

### 단계 2: 빌드 설정
```
빌드 명령: npm run build
빌드 출력 디렉터리: public
루트 디렉터리: (비워둠)
환경 변수: NODE_ENV=production
```

### 단계 3: KV Binding
1. Pages 프로젝트 > **Settings** > **Functions**
2. **KV namespace bindings** 섹션에 `CHAT_KV` 추가
3. 생성한 KV Namespace 선택

### 단계 4: 배포 확인
- 자동 배포 완료 후 `[프로젝트명].pages.dev`에서 테스트
- 도메인 연결 후 `code-nex.store`에서 접속 확인

## 5. 기술적 변경사항

### Socket.IO → Polling 방식
- 실시간 통신을 위해 2초 간격 폴링 사용
- REST API 기반으로 메시지 송수신 처리

### MongoDB → Cloudflare KV
- 사용자 데이터: `user:{username}` 키로 저장
- 메시지 데이터: `messages:recent` 키에 배열로 저장
- 최대 50개 메시지 유지 (자동 순환)

### API 엔드포인트
```
POST /api/auth/signup    # 회원가입
POST /api/auth/login     # 로그인
GET  /api/messages       # 메시지 조회
POST /api/messages       # 메시지 전송
GET  /api/status         # 서버 상태
```

## 6. 장점

✅ **완전 서버리스**: 서버 관리 불필요
✅ **글로벌 CDN**: 전 세계 빠른 접속
✅ **자동 스케일링**: 트래픽 증가 시 자동 확장
✅ **무료 티어**: 소규모 프로젝트에 적합
✅ **SSL 자동**: HTTPS 자동 설정

## 7. 제한사항

⚠️ **실시간성**: 폴링 방식으로 2초 지연
⚠️ **동시 사용자**: KV 쓰기 한계 (초당 1000회)
⚠️ **데이터 지속성**: KV는 eventual consistency
⚠️ **복잡한 쿼리**: 관계형 데이터 처리 제한

## 8. 모니터링

- Cloudflare Analytics에서 트래픽 확인
- KV 사용량 및 요청 수 모니터링
- Functions 실행 로그 확인
