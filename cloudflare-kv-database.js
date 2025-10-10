// Cloudflare KV Database wrapper for ChatCoder Light
// KV는 키-값 저장소이므로 간단한 데이터 구조로 구현

class CloudflareKVDatabase {
    constructor(env) {
        this.USERS_KV = env.USERS_KV; // Cloudflare KV namespace for users
        this.MESSAGES_KV = env.MESSAGES_KV; // Cloudflare KV namespace for messages
    }

    // 사용자 생성
    async createUser(username, password) {
        try {
            // 중복 체크
            const existingUser = await this.USERS_KV.get(`user:${username}`);
            if (existingUser) {
                throw new Error('이미 존재하는 사용자명입니다');
            }

            const user = {
                username,
                password, // 실제로는 해시된 비밀번호
                createdAt: new Date().toISOString()
            };

            await this.USERS_KV.put(`user:${username}`, JSON.stringify(user));
            
            // 사용자 목록 업데이트
            const usersList = await this.getUsersList();
            usersList.push(username);
            await this.USERS_KV.put('users:list', JSON.stringify(usersList));

            return user;
        } catch (error) {
            throw error;
        }
    }

    // 사용자 조회
    async findUserByUsername(username) {
        try {
            const userData = await this.USERS_KV.get(`user:${username}`);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('사용자 조회 오류:', error);
            return null;
        }
    }

    // 사용자 목록 조회
    async getUsersList() {
        try {
            const listData = await this.USERS_KV.get('users:list');
            return listData ? JSON.parse(listData) : [];
        } catch (error) {
            console.error('사용자 목록 조회 오류:', error);
            return [];
        }
    }

    // 메시지 저장
    async saveMessage(username, content) {
        try {
            const messageId = `msg:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
            const message = {
                id: messageId,
                username,
                content,
                timestamp: new Date().toISOString()
            };

            await this.MESSAGES_KV.put(messageId, JSON.stringify(message));
            
            // 최근 메시지 목록 업데이트 (최대 100개)
            const recentMessages = await this.getRecentMessages();
            recentMessages.push(messageId);
            
            // 100개 초과시 오래된 메시지 제거
            if (recentMessages.length > 100) {
                const oldMessageId = recentMessages.shift();
                await this.MESSAGES_KV.delete(oldMessageId);
            }
            
            await this.MESSAGES_KV.put('messages:recent', JSON.stringify(recentMessages));
            return message;
        } catch (error) {
            throw error;
        }
    }

    // 최근 메시지 조회
    async getRecentMessages() {
        try {
            const listData = await this.MESSAGES_KV.get('messages:recent');
            const messageIds = listData ? JSON.parse(listData) : [];
            
            const messages = [];
            for (const messageId of messageIds) {
                const messageData = await this.MESSAGES_KV.get(messageId);
                if (messageData) {
                    messages.push(JSON.parse(messageData));
                }
            }
            
            return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (error) {
            console.error('메시지 조회 오류:', error);
            return [];
        }
    }

    // 메시지 목록 ID 조회
    async getRecentMessageIds() {
        try {
            const listData = await this.MESSAGES_KV.get('messages:recent');
            return listData ? JSON.parse(listData) : [];
        } catch (error) {
            console.error('메시지 ID 목록 조회 오류:', error);
            return [];
        }
    }
}

module.exports = { CloudflareKVDatabase };
