// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { passwordResetOf } from '@/app/admin/(console)/managers/manager-format';

describe('passwordResetOf — 비밀번호를 초기화할 수 있는지', () => {
    it('[SUCCESS] 정지된 계정이라도 휴대폰이 있으면 초기화할 수 있다', () => {
        // 계정 상태(정지)는 판단에 쓰지 않는다 — 휴대폰 · 업체 상태만
        expect(passwordResetOf({phone: '01045678901', store_state_id: 'ACTIVE'})).toEqual({allowed: true, reason: null});
    });

    it('[FAIL:phone] 휴대폰이 없으면 막고 이유를 보인다', () => {
        expect(passwordResetOf({phone: null, store_state_id: 'ACTIVE'})).toEqual({allowed: false, reason: '휴대폰 번호가 등록되지 않은 계정입니다. 그 업체의 업체 총관리자가 휴대폰 번호를 넣은 뒤 초기화할 수 있습니다.'});
    });

    it('[FAIL:store-leave] 탈퇴한 업체의 계정이면 막고 이유를 보인다', () => {
        expect(passwordResetOf({phone: '01011223344', store_state_id: 'LEAVE'})).toEqual({allowed: false, reason: '탈퇴한 업체의 계정이라 초기화할 수 없습니다.'});
    });
});
