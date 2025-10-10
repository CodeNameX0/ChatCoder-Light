# Cloudflare Pages 배포 가이드

## 1. Cloudflare Pages 설정

### 배포 설정:
- **프레임워크 프리셋**: None
- **빌드 명령**: `npm run build`
- **빌드 출력 디렉터리**: `public`
- **루트 디렉터리**: `/`

### 환경 변수:
배포 시 다음 환경 변수를 설정해야 합니다:

```
NODE_ENV=production
PORT=8080
JWT_SECRET=your-secret-key-here
DB_TYPE=json
```

## 2. 도메인 연결 (code-nex.store)

### Cloudflare에서:
1. Pages 프로젝트 > Custom domains > Add custom domain
2. `code-nex.store` 입력
3. DNS 레코드 정보 확인

### 가비아에서:
1. 도메인 관리 > DNS 설정
2. A 레코드 또는 CNAME 레코드를 Cloudflare가 제공하는 값으로 설정

## 3. 배포 과정

1. GitHub 리포지토리와 Cloudflare Pages 연결
2. 자동 배포 설정 완료
3. 도메인 DNS 설정
4. SSL 인증서 자동 발급 대기 (보통 몇 분 소요)

## 4. 주의사항

- 서버 사이드 기능(WebSocket, 데이터베이스)은 별도 서버 필요
- Cloudflare Pages는 정적 호스팅이므로 Node.js 서버는 다른 플랫폼 필요
- 권장: Cloudflare Pages(프론트엔드) + Railway/Heroku/Vercel(백엔드)
