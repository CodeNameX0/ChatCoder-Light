// 알림음 파일 (Base64 인코딩된 짧은 사운드)
// 간단한 알림음을 위한 오디오 데이터
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJevrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzuC1fnEeSYEKYbM7+GVQQ0VYbXp8alv";

export class NotificationManager {
    constructor() {
        this.isWindowFocused = true;
        this.lastNotificationTime = 0;
        this.notificationSound = null;
        this.unreadCount = 0;
        this.originalTitle = document.title;
        
        this.initializeNotifications();
        this.initializeAudio();
        this.setupWindowFocusEvents();
    }

    // 알림 초기화
    async initializeNotifications() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                console.log('알림 권한:', permission);
            }
        }
    }

    // 오디오 초기화
    initializeAudio() {
        try {
            this.notificationSound = new Audio(NOTIFICATION_SOUND);
            this.notificationSound.volume = 0.3;
        } catch (error) {
            console.error('알림음 초기화 실패:', error);
        }
    }

    // 창 포커스 이벤트 설정
    setupWindowFocusEvents() {
        window.addEventListener('focus', () => {
            this.isWindowFocused = true;
            this.unreadCount = 0;
            this.updateTitle();
        });

        window.addEventListener('blur', () => {
            this.isWindowFocused = false;
        });

        // 페이지 가시성 변경 감지
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.isWindowFocused = true;
                this.unreadCount = 0;
                this.updateTitle();
            } else {
                this.isWindowFocused = false;
            }
        });
    }

    // 새 메시지 알림
    notifyNewMessage(message, isOwnMessage = false) {
        // 자신의 메시지는 알림 안함
        if (isOwnMessage) return;

        // 중복 알림 방지 (1초 이내)
        const now = Date.now();
        if (now - this.lastNotificationTime < 1000) return;
        this.lastNotificationTime = now;

        // 창이 비활성화되어 있을 때만 알림
        if (!this.isWindowFocused) {
            this.unreadCount++;
            this.updateTitle();
            this.showBrowserNotification(message);
        }

        // 항상 사운드 재생 (볼륨 낮게)
        this.playSoundNotification();
    }

    // 브라우저 알림 표시
    showBrowserNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const options = {
                body: message.content,
                icon: '/icon-192.png',
                badge: '/icon-72.png',
                tag: 'chatcoder-message', // 같은 태그의 알림은 대체됨
                requireInteraction: false,
                silent: false,
                timestamp: Date.now()
            };

            const notification = new Notification(
                `${message.username}님의 메시지`,
                options
            );

            // 알림 클릭 시 창 포커스
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // 3초 후 자동 닫기
            setTimeout(() => {
                notification.close();
            }, 3000);
        }
    }

    // 사운드 알림 재생
    playSoundNotification() {
        if (this.notificationSound) {
            try {
                // 이전 사운드가 재생 중이면 처음부터 다시 재생
                this.notificationSound.currentTime = 0;
                this.notificationSound.play().catch(error => {
                    console.log('알림음 재생 실패 (사용자 상호작용 필요):', error);
                });
            } catch (error) {
                console.error('사운드 알림 재생 오류:', error);
            }
        }
    }

    // 제목 업데이트 (미읽음 메시지 수 표시)
    updateTitle() {
        if (this.unreadCount > 0) {
            document.title = `(${this.unreadCount}) ${this.originalTitle}`;
        } else {
            document.title = this.originalTitle;
        }
    }

    // 알림 테스트
    testNotification() {
        const testMessage = {
            username: '테스트',
            content: '알림 테스트 메시지입니다!'
        };
        this.notifyNewMessage(testMessage, false);
    }

    // 알림 설정 확인
    getNotificationStatus() {
        return {
            supported: 'Notification' in window,
            permission: Notification.permission,
            soundEnabled: !!this.notificationSound
        };
    }
}
