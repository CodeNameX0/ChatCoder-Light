// MongoDB Atlas Data API를 사용한 데이터베이스 클래스
// Cloudflare Workers/Pages 환경에서 MongoDB 연결을 위한 HTTP API 기반 접근

class CloudflareDatabase {
    constructor(env) {
        // MongoDB Atlas Data API 설정
        this.apiUrl = env.MONGODB_DATA_API_URL || 'https://data.mongodb-api.com/app/your-app-id/endpoint/data/v1';
        this.apiKey = env.MONGODB_API_KEY;
        this.cluster = env.MONGODB_CLUSTER || 'cluster0';
        this.database = env.MONGODB_DATABASE || 'chatcoder';
        
        if (!this.apiKey) {
            throw new Error('MONGODB_API_KEY 환경 변수가 설정되지 않았습니다');
        }
    }

    // API 호출 헬퍼 메서드
    async makeApiCall(action, collection, data = {}) {
        const url = `${this.apiUrl}/action/${action}`;
        
        const payload = {
            collection: collection,
            database: this.database,
            dataSource: this.cluster,
            ...data
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.apiKey,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`MongoDB API 호출 실패: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    // 사용자 생성
    async createUser(username, password) {
        try {
            const result = await this.makeApiCall('insertOne', 'users', {
                document: {
                    username: username,
                    password: password,
                    createdAt: new Date().toISOString()
                }
            });
            return result;
        } catch (error) {
            if (error.message.includes('duplicate')) {
                throw new Error('이미 존재하는 사용자입니다');
            }
            throw error;
        }
    }

    // 사용자 찾기
    async findUser(username) {
        try {
            const result = await this.makeApiCall('findOne', 'users', {
                filter: { username: username }
            });
            return result.document;
        } catch (error) {
            console.error('사용자 찾기 오류:', error);
            return null;
        }
    }

    // 모든 사용자 조회
    async getAllUsers() {
        try {
            const result = await this.makeApiCall('find', 'users');
            return result.documents || [];
        } catch (error) {
            console.error('사용자 목록 조회 오류:', error);
            return [];
        }
    }

    // 메시지 저장
    async saveMessage(username, content) {
        try {
            const result = await this.makeApiCall('insertOne', 'messages', {
                document: {
                    username: username,
                    content: content,
                    timestamp: new Date().toISOString()
                }
            });
            return result;
        } catch (error) {
            console.error('메시지 저장 오류:', error);
            throw error;
        }
    }

    // 최근 메시지 조회
    async getRecentMessages(limit = 50) {
        try {
            const result = await this.makeApiCall('find', 'messages', {
                sort: { timestamp: -1 },
                limit: limit
            });
            
            // 시간순으로 정렬 (오래된 것부터)
            const messages = result.documents || [];
            return messages.reverse();
        } catch (error) {
            console.error('메시지 조회 오류:', error);
            return [];
        }
    }

    // 모든 메시지 조회
    async getAllMessages() {
        try {
            const result = await this.makeApiCall('find', 'messages', {
                sort: { timestamp: 1 }
            });
            return result.documents || [];
        } catch (error) {
            console.error('모든 메시지 조회 오류:', error);
            return [];
        }
    }

    // 사용자 삭제 (관리용)
    async deleteUser(username) {
        try {
            const result = await this.makeApiCall('deleteOne', 'users', {
                filter: { username: username }
            });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('사용자 삭제 오류:', error);
            return false;
        }
    }

    // 메시지 삭제 (관리용)
    async deleteMessage(messageId) {
        try {
            const result = await this.makeApiCall('deleteOne', 'messages', {
                filter: { _id: { $oid: messageId } }
            });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('메시지 삭제 오류:', error);
            return false;
        }
    }

    // 데이터베이스 연결 테스트
    async testConnection() {
        try {
            await this.makeApiCall('find', 'users', { limit: 1 });
            return true;
        } catch (error) {
            console.error('데이터베이스 연결 테스트 실패:', error);
            return false;
        }
    }
}

// Cloudflare Workers 환경에서 사용
export { CloudflareDatabase };
