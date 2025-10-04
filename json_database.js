const fs = require('fs').promises;
const path = require('path');

class JSONDatabase {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.usersFile = path.join(this.dataDir, 'users.json');
        this.messagesFile = path.join(this.dataDir, 'messages.json');
        this.init();
    }

    async init() {
        try {
            // 데이터 디렉토리 생성
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // 파일이 없으면 빈 배열로 초기화
            try {
                await fs.access(this.usersFile);
            } catch {
                await fs.writeFile(this.usersFile, JSON.stringify([]));
            }
            
            try {
                await fs.access(this.messagesFile);
            } catch {
                await fs.writeFile(this.messagesFile, JSON.stringify([]));
            }
            
            console.log('✅ JSON 파일 데이터베이스가 초기화되었습니다.');
        } catch (error) {
            console.error('❌ 데이터베이스 초기화 실패:', error);
        }
    }

    // 파일에서 데이터 읽기
    async readFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('파일 읽기 오류:', error);
            return [];
        }
    }

    // 파일에 데이터 쓰기
    async writeFile(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('파일 쓰기 오류:', error);
        }
    }

    // 사용자 생성
    async createUser(username, password) {
        try {
            const users = await this.readFile(this.usersFile);
            
            const user = {
                _id: Date.now().toString(),
                username,
                password,
                createdAt: new Date().toISOString()
            };
            
            users.push(user);
            await this.writeFile(this.usersFile, users);
            
            return user;
        } catch (error) {
            throw error;
        }
    }

    // 사용자 찾기
    async findUser(username) {
        try {
            const users = await this.readFile(this.usersFile);
            return users.find(user => user.username === username);
        } catch (error) {
            throw error;
        }
    }

    // 메시지 저장
    async saveMessage(username, content) {
        try {
            const messages = await this.readFile(this.messagesFile);
            
            const message = {
                _id: Date.now().toString(),
                username,
                content,
                timestamp: new Date().toISOString()
            };
            
            messages.push(message);
            
            // 메시지가 1000개를 초과하면 오래된 것 삭제
            if (messages.length > 1000) {
                messages.splice(0, messages.length - 1000);
            }
            
            await this.writeFile(this.messagesFile, messages);
            
            return message;
        } catch (error) {
            throw error;
        }
    }

    // 최근 메시지 가져오기
    async getRecentMessages(limit = 50) {
        try {
            const messages = await this.readFile(this.messagesFile);
            return messages.slice(-limit);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = JSONDatabase;