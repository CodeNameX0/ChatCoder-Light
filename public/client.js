class SimpleChatApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.token = null;
        this.deferredPrompt = null;
        
        this.initializeServiceWorker();
        this.initializeEventListeners();
        this.initializeTheme();
        this.checkExistingAuth();
    }

    // Service Worker 등록
    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker 등록 성공:', registration);
                
                // 푸시 알림 권한 요청
                if ('Notification' in window && Notification.permission === 'default') {
                    await Notification.requestPermission();
                }
            } catch (error) {
                console.error('Service Worker 등록 실패:', error);
            }
        }
    }

    initializeEventListeners() {
        // 인증 폼 전환
        document.getElementById('showSignup').addEventListener('click', () => this.showSignupForm());
        document.getElementById('showLogin').addEventListener('click', () => this.showLoginForm());
        
        // 폼 제출
        document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupFormElement').addEventListener('submit', (e) => this.handleSignup(e));
        document.getElementById('messageForm').addEventListener('submit', (e) => this.handleSendMessage(e));
        
        // 로그아웃
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        
        // 테마 토글
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // PWA 설치
        document.getElementById('installBtn').addEventListener('click', () => this.handleInstall());
        
        // PWA 설치 프롬프트 감지
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            // 이미 설치된 상태가 아니면 버튼 표시
            if (!this.isAppInstalled()) {
                document.getElementById('installBtn').classList.remove('hidden');
            }
            console.log('beforeinstallprompt 이벤트 감지됨');
        });

        // 앱 설치 완료 이벤트
        window.addEventListener('appinstalled', () => {
            console.log('PWA 설치 완료');
            this.deferredPrompt = null;
            document.getElementById('installBtn').classList.add('hidden');
            this.showToast('ChatCoder Light 설치 완료!', 'success');
        });

        // 페이지 로드시 설치 상태에 따라 버튼 상태 동기화
        window.addEventListener('load', () => {
            if (this.isAppInstalled()) {
                document.getElementById('installBtn').classList.add('hidden');
            }
            // iOS는 beforeinstallprompt가 없어 가이드 제공
            if (this.isIOS() && !this.isAppInstalled()) {
                this.showToast('iOS에서는 Safari 공유 메뉴 > 홈 화면에 추가로 설치하세요.', 'warning');
            }
        });

        // display-mode 변경 시 버튼 상태 갱신
        const mq = window.matchMedia('(display-mode: standalone)');
        const onChange = (e) => {
            if (e.matches) {
                document.getElementById('installBtn').classList.add('hidden');
            }
        };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
    }

    isIOS() {
        return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    }

    isAppInstalled() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = window.navigator.standalone === true; // iOS Safari
        return isStandalone || isIOSStandalone;
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('simple-chat-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('simple-chat-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    checkExistingAuth() {
        const token = localStorage.getItem('simple-chat-token');
        const user = localStorage.getItem('simple-chat-user');
        
        if (token && user) {
            this.token = token;
            this.currentUser = JSON.parse(user);
            this.connectSocket();
            this.showChatInterface();
        }
    }

    showSignupForm() {
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('signupForm').classList.add('active');
    }

    showLoginForm() {
        document.getElementById('signupForm').classList.remove('active');
        document.getElementById('loginForm').classList.add('active');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const token = document.getElementById('loginToken').value;

        try {
            const base = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '';
            const response = await fetch(base + '/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, token })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            this.currentUser = data.user;
            this.token = data.token;
            
            // 로컬 스토리지에 저장
            localStorage.setItem('simple-chat-token', this.token);
            localStorage.setItem('simple-chat-user', JSON.stringify(this.currentUser));

            this.connectSocket();
            this.showChatInterface();
            this.showToast('로그인 성공!', 'success');

        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        const token = document.getElementById('signupToken').value;

        try {
            const base = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '';
            const response = await fetch(base + '/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, token })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            this.currentUser = data.user;
            this.token = data.token;
            
            // 로컬 스토리지에 저장
            localStorage.setItem('simple-chat-token', this.token);
            localStorage.setItem('simple-chat-user', JSON.stringify(this.currentUser));

            this.connectSocket();
            this.showChatInterface();
            this.showToast('회원가입 성공!', 'success');

        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    connectSocket() {
        if (this.socket) {
            this.socket.disconnect();
        }

        const socketUrl = (window.APP_CONFIG && window.APP_CONFIG.SOCKET_URL) || undefined;
        this.socket = io(socketUrl, {
            auth: {
                token: this.token
            }
        });

        this.socket.on('connect', () => {
            console.log('서버에 연결되었습니다');
            this.loadRecentMessages();
        });

        this.socket.on('disconnect', () => {
            console.log('서버 연결이 끊어졌습니다');
        });

        this.socket.on('new-message', (message) => {
            this.displayMessage(message);
        });

        this.socket.on('user-joined', (data) => {
            this.displaySystemMessage(data.message);
        });

        this.socket.on('user-left', (data) => {
            this.displaySystemMessage(data.message);
        });

        this.socket.on('online-count', (count) => {
            document.getElementById('onlineCount').textContent = count;
        });

        this.socket.on('error', (data) => {
            this.showToast(data.message, 'error');
        });
    }

    async loadRecentMessages() {
        try {
            const base = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '';
            const response = await fetch(base + '/api/messages', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const messages = await response.json();
                const messagesList = document.getElementById('messagesList');
                messagesList.innerHTML = '';
                
                messages.forEach(message => {
                    this.displayMessage(message, false);
                });
                
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('메시지 로드 실패:', error);
        }
    }

    handleSendMessage(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (content && this.socket) {
            this.socket.emit('send-message', { content });
            messageInput.value = '';
        }
    }

    displayMessage(message, autoScroll = true) {
        const messagesList = document.getElementById('messagesList');
        const messageElement = document.createElement('div');
        
        const isOwnMessage = message.username === this.currentUser.username;
        messageElement.className = `message ${isOwnMessage ? 'own' : 'other'}`;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            <div class="message-header">
                ${isOwnMessage ? '나' : message.username} • ${timestamp}
            </div>
            <div class="message-content">
                ${this.escapeHtml(message.content)}
            </div>
        `;

        messagesList.appendChild(messageElement);
        
        if (autoScroll) {
            this.scrollToBottom();
        }
    }

    displaySystemMessage(content) {
        const messagesList = document.getElementById('messagesList');
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.textContent = content;
        messagesList.appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messagesContainer = document.querySelector('.messages-container');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showChatInterface() {
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('chatContainer').classList.remove('hidden');
    }

    showAuthInterface() {
        document.getElementById('chatContainer').classList.add('hidden');
        document.getElementById('authContainer').classList.remove('hidden');
    }

    handleLogout() {
        if (this.socket) {
            this.socket.disconnect();
        }
        
        localStorage.removeItem('simple-chat-token');
        localStorage.removeItem('simple-chat-user');
        
        this.currentUser = null;
        this.token = null;
        
        this.showAuthInterface();
        this.showToast('로그아웃되었습니다', 'success');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // PWA 설치 처리
    async handleInstall() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.showToast('ChatCoder Light 설치 완료!', 'success');
            }
            
            this.deferredPrompt = null;
            document.getElementById('installBtn').classList.add('hidden');
        } else {
            // iOS 또는 프롬프트 미발생 케이스 안내
            if (this.isIOS()) {
                this.showToast('iOS: Safari 공유 메뉴에서 홈 화면에 추가를 사용하세요.', 'warning');
            } else {
                this.showToast('설치 프롬프트를 표시할 수 없습니다. 잠시 후 다시 시도하세요.', 'warning');
                console.log('deferredPrompt가 없어 설치 프롬프트를 표시할 수 없습니다.');
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new SimpleChatApp();
});