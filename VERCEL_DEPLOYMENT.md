# Vercel 배포 가이드

## 🚀 Vercel 배포 단계

### 1. Vercel 계정 연결
1. [Vercel.com](https://vercel.com) 가입/로그인
2. **Import Git Repository** 클릭
3. **ChatCoder-Light** 리포지토리 선택

### 2. 환경 변수 설정
**Environment Variables**에서 다음 변수들을 추가:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://CodeNameX0:Qwerty11%5E%5E@cluster0.k8t2y68.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=chatcoder-super-secret-jwt-key-2025
SIGNUP_TOKEN=chatcoder2025secure
```

### 3. 도메인 연결
1. **Settings** → **Domains**
2. **Add Domain** → `code-nex.store` 입력
3. DNS 설정 안내에 따라 가비아에서 설정

### 4. 가비아 DNS 설정
```
타입: A
이름: @
값: 76.76.19.19

타입: CNAME
이름: www
값: cname.vercel-dns.com
```

### 5. 자동 배포
- GitHub에 푸시할 때마다 자동 배포
- 실시간 로그 확인 가능
- 도메인에서 바로 접속 가능

## ✅ 장점
- MongoDB 연결이 매우 간단
- Socket.IO 완벽 지원
- 실시간 채팅 정상 작동
- SSL 인증서 자동 발급
