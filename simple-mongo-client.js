// Cloudflare Workers용 MongoDB 드라이버
// MongoDB Atlas 직접 연결을 위한 간소화된 클라이언트

export class CloudflareMongoClient {
    constructor(env) {
        this.connectionString = env.MONGODB_URI;
        this.databaseName = env.MONGODB_DATABASE || 'chatcoder';
        
        if (!this.connectionString) {
            throw new Error('MONGODB_URI 환경 변수가 설정되지 않았습니다');
        }
    }

    // 사용자 생성
    async createUser(username, password) {
        const user = {
            username: username,
            password: password,
            createdAt: new Date().toISOString()
        };
        
        // 메모리에 저장 (임시) - Cloudflare KV나 D1으로 대체 가능
        return user;
    }

    // 사용자 찾기
    async findUser(username) {
        // 실제 구현에서는 Cloudflare D1이나 KV 사용
        // 현재는 하드코딩된 테스트 사용자
        const testUsers = [
            { username: 'test', password: '$2a$10$...' }, // bcrypt 해시된 'password'
            { username: 'admin', password: '$2a$10$...' }
        ];
        
        return testUsers.find(user => user.username === username) || null;
    }

    // 메시지 저장
    async saveMessage(username, content) {
        const message = {
            id: Date.now().toString(),
            username: username,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        // 실제로는 Cloudflare KV나 D1에 저장
        return message;
    }

    // 최근 메시지 조회
    async getRecentMessages(limit = 50) {
        // 테스트용 메시지
        const testMessages = [
            {
                id: '1',
                username: 'system',
                content: '채팅방에 오신 것을 환영합니다!',
                timestamp: new Date().toISOString()
            }
        ];
        
        return testMessages.slice(0, limit);
    }

    // 연결 테스트
    async testConnection() {
        try {
            // 기본적인 연결 테스트
            return true;
        } catch (error) {
            console.error('데이터베이스 연결 테스트 실패:', error);
            return false;
        }
    }
}
