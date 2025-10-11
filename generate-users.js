// 기본 사용자 계정 생성 도구
// 비밀번호를 해시화하여 메모리 데이터베이스에 저장할 값들 생성

import { CloudflareCrypto } from './cloudflare-crypto.js';

async function generateDefaultUsers() {
    console.log('=== ChatCoder Light 기본 계정 ===\n');
    
    // 기본 계정들
    const accounts = [
        { username: 'admin', password: 'admin123' },
        { username: 'test', password: 'hello' },
        { username: 'user1', password: 'password' },
        { username: 'demo', password: 'demo2025' }
    ];

    for (const account of accounts) {
        const hash = await CloudflareCrypto.hashPassword(account.password);
        console.log(`사용자: ${account.username}`);
        console.log(`비밀번호: ${account.password}`);
        console.log(`해시: ${hash}`);
        console.log('---');
    }
}

// 실행
if (typeof window === 'undefined') {
    generateDefaultUsers();
}

export { generateDefaultUsers };
