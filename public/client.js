// CloudFlare Pages용 채팅 클라이언트 (Socket.IO 없이 polling 방식)
class CloudflareSimpleChatApp {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.deferredPrompt = null;
        this.pollingInterval = null;
        this.lastMessageId = 0;
        
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
            document.getElementById('installBtn').classList.remove('hidden');
        });

        // Enter 키로 메시지 전송
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage(e);
            }
        });
    }

    // API 요청 함수
    async apiRequest(endpoint, options = {}) {
        const baseUrl = window.APP_CONFIG?.API_BASE || '';
        const url = `${baseUrl}/api/${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (this.token) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '요청 처리 중 오류가 발생했습니다');
            }
            
            return data;
        } catch (error) {
            console.error('API 요청 오류:', error);
            throw error;
        }
    }

    // 테마 초기화
    initializeTheme() {
        const savedTheme = localStorage.getItem('chatcoder-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    // 기존 인증 확인
    checkExistingAuth() {
        const token = localStorage.getItem('chatcoder-token');
        const userData = localStorage.getItem('chatcoder-user');
        
        if (token && userData) {
            try {
                this.token = token;
                this.currentUser = JSON.parse(userData);
                this.showChatInterface();
                this.startMessagePolling();
            } catch (error) {
                console.error('저장된 인증 정보 오류:', error);
                this.clearAuthData();
            }
        }
    }

    // 회원가입 폼 표시
    showSignupForm() {
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('signupForm').classList.add('active');
    }

    // 로그인 폼 표시
    showLoginForm() {
        document.getElementById('signupForm').classList.remove('active');
        document.getElementById('loginForm').classList.add('active');
    }

    // 회원가입 처리
    async handleSignup(e) {
        e.preventDefault();
        
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const token = document.getElementById('signupToken').value.trim();
        
        if (password !== confirmPassword) {
            this.showToast('비밀번호가 일치하지 않습니다', 'error');
            return;
        }

        try {
            const data = await this.apiRequest('auth/signup', {
                method: 'POST',
                body: JSON.stringify({ username, password, token }),
            });

            this.token = data.token;
            this.currentUser = data.user;
            
            // 로컬 스토리지에 저장
            localStorage.setItem('chatcoder-token', this.token);
            localStorage.setItem('chatcoder-user', JSON.stringify(this.currentUser));
            
            this.showToast(data.message, 'success');
            this.showChatInterface();
            this.startMessagePolling();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // 로그인 처리
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const token = document.getElementById('loginToken').value.trim();

        try {
            const data = await this.apiRequest('auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password, token }),
            });

            this.token = data.token;
            this.currentUser = data.user;
            
            // 로컬 스토리지에 저장
            localStorage.setItem('chatcoder-token', this.token);
            localStorage.setItem('chatcoder-user', JSON.stringify(this.currentUser));
            
            this.showToast(data.message, 'success');
            this.showChatInterface();
            this.startMessagePolling();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // 메시지 전송 처리
    async handleSendMessage(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content) return;

        try {
            await this.apiRequest('messages', {
                method: 'POST',
                body: JSON.stringify({ content }),
            });

            messageInput.value = '';
            // 메시지 폴링을 즉시 실행하여 새 메시지 표시
            this.pollMessages();
        } catch (error) {
            this.showToast('메시지 전송 실패: ' + error.message, 'error');
        }
    }

    // 메시지 polling 시작
    startMessagePolling() {
        // 기존 폴링 중지
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        // 즉시 메시지 로드
        this.pollMessages();
        
        // 2초마다 새 메시지 확인
        this.pollingInterval = setInterval(() => {
            this.pollMessages();
        }, 2000);
    }

    // 메시지 조회
    async pollMessages() {
        try {
            const data = await this.apiRequest('messages');
            this.displayMessages(data.messages);
        } catch (error) {
            console.error('메시지 조회 실패:', error);
        }
    }

    // 메시지 표시
    displayMessages(messages) {
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = '';

        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.username === this.currentUser.username ? 'own' : 'other'}`;
            
            const timestamp = new Date(message.timestamp).toLocaleTimeString();
            
            messageElement.innerHTML = `
                <div class="message-header">${message.username} • ${timestamp}</div>
                <div class="message-content">${this.escapeHtml(message.content)}</div>
            `;
            
            messagesList.appendChild(messageElement);
        });

        // 스크롤을 맨 아래로
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 채팅 인터페이스 표시
    showChatInterface() {
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('chatContainer').classList.remove('hidden');
    }

    // 로그아웃 처리
    handleLogout() {
        this.clearAuthData();
        
        // 폴링 중지
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        document.getElementById('chatContainer').classList.add('hidden');
        document.getElementById('authContainer').classList.remove('hidden');
        
        this.showToast('로그아웃되었습니다', 'success');
    }

    // 인증 데이터 삭제
    clearAuthData() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('chatcoder-token');
        localStorage.removeItem('chatcoder-user');
    }

    // 테마 토글
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('chatcoder-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    // 테마 아이콘 업데이트
    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // PWA 설치
    async handleInstall() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            this.showToast('앱이 설치되었습니다', 'success');
        }
        
        this.deferredPrompt = null;
        document.getElementById('installBtn').classList.add('hidden');
    }

    // 토스트 알림 표시
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new CloudflareSimpleChatApp();
});
