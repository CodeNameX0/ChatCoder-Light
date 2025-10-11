// MongoDB 연결을 위한 대안 방법
// Cloudflare Workers에서 MongoDB Atlas 직접 연결

class MongoDBHTTPClient {
    constructor(env) {
        // MongoDB Atlas Connection String을 사용한 HTTP 접근
        this.connectionString = env.MONGODB_URI;
        this.dbName = env.MONGODB_DATABASE || 'chatcoder';
        
        if (!this.connectionString) {
            throw new Error('MONGODB_URI 환경 변수가 설정되지 않았습니다');
        }
    }

    // MongoDB REST API 호출 (Atlas Search 사용)
    async makeRequest(method, collection, operation, data = {}) {
        // MongoDB Atlas의 REST API 엔드포인트 구성
        const baseUrl = this.getRestApiUrl();
        
        const payload = {
            collection: collection,
            database: this.dbName,
            ...data
        };

        try {
            const response = await fetch(`${baseUrl}/action/${operation}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Request-Headers': '*',
                    'api-key': this.extractApiKey()
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            return await response.json();
        } catch (error) {
            console.error('MongoDB 요청 실패:', error);
            throw error;
        }
    }

    // Connection String에서 API 정보 추출
    getRestApiUrl() {
        // MongoDB Atlas REST API URL 형식
        return 'https://data.mongodb-api.com/app/application-0-abcde/endpoint/data/v1';
    }

    extractApiKey() {
        // 환경 변수에서 API 키 추출
        return process.env.MONGODB_API_KEY || 'your-api-key';
    }

    // 사용자 생성
    async createUser(username, password) {
        return await this.makeRequest('POST', 'users', 'insertOne', {
            document: {
                username: username,
                password: password,
                createdAt: new Date().toISOString()
            }
        });
    }

    // 사용자 찾기
    async findUser(username) {
        const result = await this.makeRequest('POST', 'users', 'findOne', {
            filter: { username: username }
        });
        return result.document;
    }

    // 메시지 저장
    async saveMessage(username, content) {
        return await this.makeRequest('POST', 'messages', 'insertOne', {
            document: {
                username: username,
                content: content,
                timestamp: new Date().toISOString()
            }
        });
    }

    // 최근 메시지 조회
    async getRecentMessages(limit = 50) {
        const result = await this.makeRequest('POST', 'messages', 'find', {
            sort: { timestamp: -1 },
            limit: limit
        });
        
        const messages = result.documents || [];
        return messages.reverse();
    }
}

export { MongoDBHTTPClient };
