import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MemberStateBand from '@/app/(user)/_components/MemberStateBand';

describe('MemberStateBand', () => {
    it('[SUCCESS] 이용 제한(BLOCK)이면 정지 사유를 그대로', () => {
        render(<MemberStateBand me={{state_id: 'BLOCK', block_comment: '예약 뒤 이용하지 않은 일이 여러 번 반복되었습니다.', leave_reserved_at: null}} />);

        expect(screen.getByText('이용이 제한된 계정이에요')).toBeTruthy();
        expect(screen.getByText('정지 사유: 예약 뒤 이용하지 않은 일이 여러 번 반복되었습니다.')).toBeTruthy();
    });

    it('[SUCCESS] 탈퇴 대기(LEAVE_WAIT)면 탈퇴 예정 시각(한국 시각 그대로) · 철회 링크', () => {
        render(<MemberStateBand me={{state_id: 'LEAVE_WAIT', block_comment: null, leave_reserved_at: '2026-11-24 15:20:00'}} />);

        expect(screen.getByText('탈퇴 대기 중이에요')).toBeTruthy();
        expect(screen.getByText('2026년 11월 24일 15:20에 탈퇴돼요. 그 전까지 철회할 수 있어요.')).toBeTruthy();
        expect(screen.getByRole('link', {name: '탈퇴 철회하기'}).getAttribute('href')).toBe('/me/');
    });

    it('[FAIL:active] 정상 회원 · 내 정보 없음이면 그리지 않는다', () => {
        const {container: active} = render(<MemberStateBand me={{state_id: 'ACTIVE', block_comment: null, leave_reserved_at: null}} />);
        const {container: none} = render(<MemberStateBand me={null} />);

        expect(active.innerHTML).toBe('');
        expect(none.innerHTML).toBe('');
    });
});
