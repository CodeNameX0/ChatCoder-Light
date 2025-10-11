// 메모리 기반 JSON 데이터베이스
// Cloudflare Workers 환경에서 간단한 인메모리 저장소

export class MemoryDatabase {
    constructor() {
        // 메모리에 저장되는 데이터
        this.users = new Map();
        this.messages = [];
        this.initializeTestData();
    }

    // 테스트용 초기 데이터
    initializeTestData() {
        // 기본 사용자 계정들
        this.users.set('admin', {
            username: 'admin',
            password: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // 해시된 'admin123'
            createdAt: new Date().toISOString()
        });

        this.users.set('test', {
            username: 'test',
            password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 해시된 'hello'
            createdAt: new Date().toISOString()
        });

        // 환영 메시지
        this.messages = [
            {
                id: '1',
                username: 'system',
                content: '🎉 ChatCoder Light에 오신 것을 환영합니다!',
                timestamp: new Date().toISOString()
            },
            {
                id: '2', 
                username: 'system',
                content: '💡 테스트 계정: admin/admin123 또는 test/hello',
                timestamp: new Date().toISOString()
            }
        ];
    }

    // 사용자 생성
    async createUser(username, hashedPassword) {
        if (this.users.has(username)) {
            throw new Error('이미 존재하는 사용자입니다');
        }

        const user = {
            username: username,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        this.users.set(username, user);
        return user;
    }

    // 사용자 찾기
    async findUser(username) {
        return this.users.get(username) || null;
    }

    // 모든 사용자 조회
    async getAllUsers() {
        return Array.from(this.users.values());
    }

    // 메시지 저장
    async saveMessage(username, content) {
        const message = {
            id: (this.messages.length + 1).toString(),
            username: username,
            content: content,
            timestamp: new Date().toISOString()
        };

        this.messages.push(message);
        
        // 메시지 개수 제한 (최근 100개만 유지)
        if (this.messages.length > 100) {
            this.messages = this.messages.slice(-100);
        }

        return message;
    }

    // 최근 메시지 조회
    async getRecentMessages(limit = 50) {
        return this.messages.slice(-limit);
    }

    // 모든 메시지 조회
    async getAllMessages() {
        return this.messages;
    }

    // 사용자 삭제
    async deleteUser(username) {
        return this.users.delete(username);
    }

    // 메시지 삭제
    async deleteMessage(messageId) {
        const index = this.messages.findIndex(msg => msg.id === messageId);
        if (index !== -1) {
            this.messages.splice(index, 1);
            return true;
        }
        return false;
    }

    // 연결 테스트
    async testConnection() {
        return {
            status: 'connected',
            userCount: this.users.size,
            messageCount: this.messages.length,
            uptime: 'memory-based'
        };
    }

    // 데이터베이스 상태
    getStats() {
        return {
            users: this.users.size,
            messages: this.messages.length,
            lastMessage: this.messages.length > 0 ? this.messages[this.messages.length - 1].timestamp : null
        };
    }

    // 데이터 내보내기 (JSON)
    exportData() {
        return {
            users: Object.fromEntries(this.users),
            messages: this.messages,
            exportedAt: new Date().toISOString()
        };
    }

    // 데이터 가져오기 (JSON)
    importData(data) {
        if (data.users) {
            this.users = new Map(Object.entries(data.users));
        }
        if (data.messages) {
            this.messages = data.messages;
        }
    }
}
