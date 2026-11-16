// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { areaOf, isLoginPath, loginUrl, safeReturnPath } from '@/shared/utils/area';

describe('areaOf', () => {
    it('[SUCCESS] 루트와 그 밖의 주소는 이용자 영역', () => {
        expect(areaOf('/')).toBe('user');
        expect(areaOf('/stores/1/')).toBe('user');
    });

    it('[SUCCESS] /manager · /admin 아래는 그 영역', () => {
        expect(areaOf('/manager')).toBe('manager');
        expect(areaOf('/manager/abc/login/')).toBe('manager');
        expect(areaOf('/admin/')).toBe('admin');
    });

    it('[FAIL:prefix] 이름만 비슷한 주소는 이용자 영역', () => {
        expect(areaOf('/managerX/')).toBe('user');
        expect(areaOf('/administrator')).toBe('user');
    });
});

describe('loginUrl', () => {
    it('[SUCCESS] 이용자 로그인에 돌아올 주소(path + query)를 return_url 로 붙인다', () => {
        expect(loginUrl('user', '/stores/1/?date=2026-11-20')).toBe('/login/?return_url=%2Fstores%2F1%2F%3Fdate%3D2026-11-20');
    });

    it('[SUCCESS] 매니저는 /manager/login/ 으로', () => {
        expect(loginUrl('manager', '/manager/rooms/')).toBe('/manager/login/?return_url=%2Fmanager%2Frooms%2F');
    });

    it('[FAIL:no-return] 돌아올 주소가 없거나 로그인 화면 자신이면 붙이지 않는다', () => {
        expect(loginUrl('admin', null)).toBe('/admin/login/');
        expect(loginUrl('user', '/login/')).toBe('/login/');
    });
});

describe('safeReturnPath', () => {
    it('[SUCCESS] 같은 사이트 주소는 그대로', () => {
        expect(safeReturnPath('/stores/1/', 'user')).toBe('/stores/1/');
    });

    it('[FAIL:external] 다른 사이트 · 빈 값은 그 영역 첫 화면으로', () => {
        expect(safeReturnPath('//evil.com/', 'user')).toBe('/');
        expect(safeReturnPath('https://evil.com/', 'manager')).toBe('/manager/');
        expect(safeReturnPath('/\\evil.com', 'admin')).toBe('/admin/');
        expect(safeReturnPath(null, 'user')).toBe('/');
    });

    it('[FAIL:control-char] 탭 · 줄바꿈을 끼워 다른 사이트로 보내는 주소도 막는다', () => {
        expect(safeReturnPath('/\t/evil.com', 'user')).toBe('/');
        expect(safeReturnPath('/\n/evil.com/path', 'manager')).toBe('/manager/');
        expect(loginUrl('user', '/\t/evil.com')).toBe('/login/');
    });

    it('[FAIL:dot-segment] 점 경로를 풀면 // 로 시작하는 주소도 막는다 — 다시 쓰면 다른 사이트', () => {
        expect(safeReturnPath('/..//evil.com', 'user')).toBe('/');
        expect(safeReturnPath('/.//evil.com', 'manager')).toBe('/manager/');
        expect(safeReturnPath('/%2e%2e//evil.com', 'user')).toBe('/');
        expect(safeReturnPath('/a/..//evil.com/path', 'admin')).toBe('/admin/');
        expect(loginUrl('user', '/..//evil.com')).toBe('/login/');
        expect(safeReturnPath('/stores/../me/', 'user')).toBe('/me/');
    });
});

describe('isLoginPath', () => {
    it('[SUCCESS] 그 영역 로그인 화면이면 true — 끝 / · query 상관없이', () => {
        expect(isLoginPath('/manager/login/', 'manager')).toBe(true);
        expect(isLoginPath('/manager/login', 'manager')).toBe(true);
        expect(isLoginPath('/login/?return_url=%2F', 'user')).toBe(true);
        expect(isLoginPath('/manager/rooms/', 'manager')).toBe(false);
    });
});
