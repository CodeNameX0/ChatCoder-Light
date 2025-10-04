const mongoose = require('mongoose');

// 사용자 스키마
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// 메시지 스키마
const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

class Database {
    constructor() {
        this.isConnected = false;
        this.memoryUsers = new Map();
        this.memoryMessages = [];
        this.connect();
    }

    async connect() {
        try {
            const mongoURI = process.env.MONGODB_URI;
            if (!mongoURI) {
                throw new Error('MONGODB_URI 환경 변수가 설정되지 않았습니다');
            }
            await mongoose.connect(mongoURI);
            console.log('✅ MongoDB Atlas에 연결되었습니다.');
            this.isConnected = true;
        } catch (error) {
            console.error('❌ MongoDB Atlas 연결 실패 - 메모리 모드로 실행합니다.');
            console.error('Error:', error.message);
            this.isConnected = false;
        }
    }

    // 사용자 생성
    async createUser(username, password) {
        if (this.isConnected) {
            try {
                const user = new User({ username, password });
                await user.save();
                return user;
            } catch (error) {
                throw error;
            }
        } else {
            // 메모리 백업
            const user = {
                _id: Date.now().toString(),
                username,
                password,
                createdAt: new Date()
            };
            this.memoryUsers.set(username, user);
            return user;
        }
    }

    // 사용자 찾기
    async findUser(username) {
        if (this.isConnected) {
            try {
                return await User.findOne({ username });
            } catch (error) {
                throw error;
            }
        } else {
            // 메모리 백업
            return this.memoryUsers.get(username);
        }
    }

    // 메시지 저장
    async saveMessage(username, content) {
        if (this.isConnected) {
            try {
                const message = new Message({ username, content });
                await message.save();
                return message;
            } catch (error) {
                throw error;
            }
        } else {
            // 메모리 백업
            const message = {
                _id: Date.now().toString(),
                username,
                content,
                timestamp: new Date()
            };
            this.memoryMessages.push(message);
            
            // 메시지가 너무 많아지면 오래된 것 삭제 (최대 1000개 유지)
            if (this.memoryMessages.length > 1000) {
                this.memoryMessages.splice(0, this.memoryMessages.length - 1000);
            }
            
            return message;
        }
    }

    // 최근 메시지 가져오기
    async getRecentMessages(limit = 50) {
        if (this.isConnected) {
            try {
                return await Message.find()
                    .sort({ timestamp: -1 })
                    .limit(limit)
                    .exec()
                    .then(messages => messages.reverse());
            } catch (error) {
                throw error;
            }
        } else {
            // 메모리 백업
            return this.memoryMessages.slice(-limit);
        }
    }

}

module.exports = { Database, User, Message };