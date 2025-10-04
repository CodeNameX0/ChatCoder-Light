require('dotenv').config();
const express = require('express');

const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Database } = require('./database');

// MongoDB 데이터베이스 초기화
const db = new Database();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 환경 변수
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CHAT_TOKEN = 'chat-all-us1'; // 접속 토큰

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// JWT 인증 미들웨어
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '액세스 토큰이 필요합니다' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '유효하지 않은 토큰입니다' });
        }
        req.user = user;
        next();
    });
};

// Socket.IO 인증 미들웨어
const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return next(new Error('Authentication error'));
        }
        socket.userId = user.id;
        socket.username = user.username;
        next();
    });
};

// API Routes

// 회원가입
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, token } = req.body;

        // 토큰 확인
        if (token !== CHAT_TOKEN) {
            return res.status(400).json({ error: '올바른 채팅 토큰을 입력해주세요' });
        }

        // 사용자 존재 확인
        const existingUser = await db.findUser(username);
        if (existingUser) {
            return res.status(400).json({ error: '이미 존재하는 사용자명입니다' });
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        // 새 사용자 생성
        const user = await db.createUser(username, hashedPassword);

        // JWT 토큰 생성
        const authToken = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: '회원가입이 완료되었습니다',
            user: { id: user._id, username: user.username },
            token: authToken
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
});

// 로그인
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, token } = req.body;

        // 토큰 확인
        if (token !== CHAT_TOKEN) {
            return res.status(400).json({ error: '올바른 채팅 토큰을 입력해주세요' });
        }

        // 사용자 찾기
        const user = await db.findUser(username);
        if (!user) {
            return res.status(400).json({ error: '잘못된 사용자명 또는 비밀번호입니다' });
        }

        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: '잘못된 사용자명 또는 비밀번호입니다' });
        }

        // JWT 토큰 생성
        const authToken = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: '로그인 성공',
            user: { id: user._id, username: user.username },
            token: authToken
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
});

// 최근 메시지 가져오기
app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const recentMessages = await db.getRecentMessages(50);
        res.json(recentMessages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: '메시지를 불러오는 중 오류가 발생했습니다' });
    }
});

// 온라인 사용자 추적
const onlineUsers = new Set();

// Socket.IO 연결 처리
io.use(authenticateSocket);

io.on('connection', (socket) => {
    console.log(`User ${socket.username} connected`);
    
    // 온라인 사용자 추가
    onlineUsers.add(socket.username);

    // 다른 사용자들에게 접속 알림
    socket.broadcast.emit('user-joined', {
        username: socket.username,
        message: `${socket.username}님이 채팅방에 입장했습니다.`
    });

    // 현재 온라인 사용자 수 전송
    io.emit('online-count', onlineUsers.size);

    // 메시지 전송
    socket.on('send-message', async (data) => {
        try {
            const { content } = data;
            
            if (!content || content.trim() === '') {
                return;
            }

            // 데이터베이스에 메시지 저장
            const message = await db.saveMessage(socket.username, content.trim());

            // 모든 사용자에게 메시지 전송
            io.emit('new-message', {
                id: message._id,
                username: message.username,
                content: message.content,
                timestamp: message.timestamp
            });

            console.log(`Message from ${socket.username}: ${content}`);

        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('error', { message: '메시지 전송 중 오류가 발생했습니다' });
        }
    });

    // 연결 해제 처리
    socket.on('disconnect', () => {
        console.log(`User ${socket.username} disconnected`);
        onlineUsers.delete(socket.username);
        
        // 다른 사용자들에게 퇴장 알림
        socket.broadcast.emit('user-left', {
            username: socket.username,
            message: `${socket.username}님이 채팅방을 나갔습니다.`
        });

        // 현재 온라인 사용자 수 업데이트
        io.emit('online-count', onlineUsers.size);
    });
});

// 기본 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
server.listen(PORT, () => {
    console.log(`🚀 ChatCoder Light running on port ${PORT}`);
    console.log(`📱 Open your browser and go to http://localhost:${PORT}`);
    console.log(`🔑 Chat Token: ${CHAT_TOKEN}`);
});

module.exports = { app, server, io };