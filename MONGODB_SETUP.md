# MongoDB Atlas Data API 설정 가이드

## 1. MongoDB Atlas에서 Data API 활성화

### Atlas Dashboard에서:
1. **Data API** 탭으로 이동
2. **Enable Data API** 클릭
3. **Create API Key** 클릭하여 API 키 생성
4. API 키를 복사하여 안전하게 보관

### App ID 확인:
1. Data API URL에서 App ID 확인
   ```
   https://data.mongodb-api.com/app/[YOUR_APP_ID]/endpoint/data/v1
   ```

## 2. Cloudflare Pages 환경 변수 설정

Pages 프로젝트 설정에서 다음 환경 변수 추가:

```
# 인증
SIGNUP_TOKEN=your-secure-signup-token-123
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# MongoDB Atlas Data API
MONGODB_DATA_API_URL=https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1
MONGODB_API_KEY=your_mongodb_api_key_from_atlas
MONGODB_CLUSTER=cluster0
MONGODB_DATABASE=chatcoder
```

## 3. 보안 설정

### MongoDB Atlas에서:
1. **Network Access**에서 IP 허용 목록 설정
   - Cloudflare IP 대역 또는 `0.0.0.0/0` (모든 IP 허용)
2. **Database Access**에서 API 키 권한 설정
   - 읽기/쓰기 권한 부여

## 4. 테스트

배포 후 다음 엔드포인트로 테스트:
```
GET https://your-domain.com/api/test
```

성공 시 응답:
```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2025-10-10T..."
}
```

## 5. 주의사항

- API 키는 절대 클라이언트 사이드에 노출하면 안됩니다
- 정기적으로 API 키를 교체하세요
- Rate Limit을 고려하여 API 호출을 최적화하세요
- 민감한 데이터는 암호화하여 저장하세요
