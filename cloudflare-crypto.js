// Cloudflare Workers용 암호화 유틸리티
// Web Crypto API를 사용한 bcrypt/JWT 대안

export class CloudflareCrypto {
    // 간단한 해시 함수 (bcrypt 대안)
    static async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'chatcoder-salt-2025');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 비밀번호 검증
    static async verifyPassword(password, hash) {
        const passwordHash = await this.hashPassword(password);
        return passwordHash === hash;
    }

    // 간단한 JWT 생성 (Web Crypto API 사용)
    static async createToken(payload, secret) {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };

        const now = Math.floor(Date.now() / 1000);
        const tokenPayload = {
            ...payload,
            iat: now,
            exp: now + (24 * 60 * 60) // 24시간
        };

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
        
        const signature = await this.sign(`${encodedHeader}.${encodedPayload}`, secret);
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    // JWT 검증
    static async verifyToken(token, secret) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const [header, payload, signature] = parts;
            
            // 서명 검증
            const expectedSignature = await this.sign(`${header}.${payload}`, secret);
            if (signature !== expectedSignature) return null;

            // 페이로드 디코딩
            const decodedPayload = JSON.parse(this.base64UrlDecode(payload));
            
            // 만료 시간 확인
            if (decodedPayload.exp < Math.floor(Date.now() / 1000)) return null;

            return decodedPayload;
        } catch (error) {
            return null;
        }
    }

    // HMAC 서명
    static async sign(data, secret) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(data);

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        const signatureArray = Array.from(new Uint8Array(signature));
        return this.base64UrlEncode(String.fromCharCode(...signatureArray));
    }

    // Base64 URL 인코딩
    static base64UrlEncode(str) {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    // Base64 URL 디코딩
    static base64UrlDecode(str) {
        str += '='.repeat(4 - str.length % 4);
        return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    }
}
