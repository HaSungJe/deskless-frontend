import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { UserMeContext, UserMeContextType } from '@/app/(user)/_components/UserMeProvider';
import MyPageContent from '@/app/(user)/me/MyPageContent';
import { UserMeResultDto } from '@/contracts/user/dto/user-me.dto';
import RootLayoutProvider, { AuthContextType } from '@/shared/providers/RootLayoutProvider';

const {leaveUser, cancelLeave, showErrorPopup, logout, replaceDocument} = vi.hoisted(() => ({
    leaveUser: vi.fn(),
    cancelLeave: vi.fn(),
    showErrorPopup: vi.fn(),
    logout: vi.fn(),
    replaceDocument: vi.fn(),
}));

vi.mock('@/contracts/user/api', () => ({leaveUser, cancelLeave}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));
vi.mock('@/shared/utils/base-path', async (importOriginal) => ({...(await importOriginal<typeof import('@/shared/utils/base-path')>()), replaceDocument}));

/** 로그인한 이용자 */
const AUTH: AuthContextType = {area: 'user', token: 'user-token', isLogin: true, setToken: vi.fn(), onExpired: vi.fn(), logout};

/**
 * 내 정보 — 정상 · 휴대폰 인증 완료
 *
 * @param extra 바꿀 값
 */
function me(extra: Partial<UserMeResultDto> = {}): UserMeResultDto {
    return {
        user_id: 'u'.repeat(32),
        user_search_code: 'ABCD1234',
        nickname: '여행하는고양이',
        gender: 'F',
        birth: '1998-03-14',
        sns_id: 'KAKAO',
        phone: '01012345678',
        is_phone_verified: 1,
        state_id: 'ACTIVE',
        block_comment: null,
        leave_reserved_at: null,
        created_at: '2026-03-02T03:00:00.000Z',
        ...extra,
    } as UserMeResultDto;
}

/**
 * 마이페이지를 그리고 들어올 때의 내 정보 다시 읽기를 기다린다
 *
 * @param current 지금 내 정보
 * @param reloadMe 다시 읽기
 */
async function renderMyPage(current: UserMeResultDto | null, reloadMe: UserMeContextType['reloadMe']): Promise<void> {
    await act(async () => {
        render(
            <RootLayoutProvider rootLayoutLoading={false} auth={AUTH}>
                <UserMeContext.Provider value={{me: current, reloadMe}}>
                    <MyPageContent />
                </UserMeContext.Provider>
            </RootLayoutProvider>,
        );
    });
}

beforeEach(() => {
    leaveUser.mockReset().mockResolvedValue(null);
    cancelLeave.mockReset().mockResolvedValue(null);
    logout.mockReset().mockResolvedValue(true);
    replaceDocument.mockClear();
    showErrorPopup.mockClear();
});

describe('MyPageContent', () => {
    it('[SUCCESS] 사유를 적고 탈퇴를 신청한다 → 탈퇴(큐) 1번(사유) → 내 정보 다시 읽음', async () => {
        const reloadMe = vi.fn<UserMeContextType['reloadMe']>().mockResolvedValueOnce(me()).mockResolvedValueOnce(me({state_id: 'LEAVE_WAIT', leave_reserved_at: '2026-12-02 15:20:00'}));

        await renderMyPage(me(), reloadMe);
        expect(reloadMe).toHaveBeenCalledTimes(1);
        expect(screen.getByText('여행하는고양이')).toBeTruthy();
        expect(screen.getByText('010-1234-5678')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', {name: '탈퇴 신청'}));
        const dialog = within(document.querySelector('dialog') as HTMLElement);
        fireEvent.change(dialog.getByRole('textbox', {name: /탈퇴 사유/}), {target: {value: '이사해요'}});
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '탈퇴 신청'}));
        });

        expect(leaveUser).toHaveBeenCalledTimes(1);
        expect(leaveUser.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect({...leaveUser.mock.calls[0][1]}).toEqual({leave_comment: '이사해요'});
        expect(reloadMe).toHaveBeenCalledTimes(2);
        expect(cancelLeave).not.toHaveBeenCalled();
        expect(showErrorPopup).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 탈퇴 대기에서 철회한다 → 철회(큐) 1번 → 내 정보 다시 읽음', async () => {
        const leaving = me({state_id: 'LEAVE_WAIT', leave_reserved_at: '2026-12-02 15:20:00'});
        const reloadMe = vi.fn<UserMeContextType['reloadMe']>().mockResolvedValueOnce(leaving).mockResolvedValueOnce(me());

        await renderMyPage(leaving, reloadMe);
        expect(screen.queryByRole('button', {name: '탈퇴 신청'})).toBeNull();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '탈퇴 철회'}));
        });

        expect(cancelLeave).toHaveBeenCalledTimes(1);
        expect(cancelLeave.mock.calls[0][0]).toMatchObject({token: 'user-token'});
        expect(reloadMe).toHaveBeenCalledTimes(2);
        expect(leaveUser).not.toHaveBeenCalled();
        expect(showErrorPopup).not.toHaveBeenCalled();
    });

    it('[FAIL:unchecked] 탈퇴(큐) 뒤 내 정보를 다시 읽지 못한다 → 늦어짐이 아니라 "확인하지 못했어요"', async () => {
        const reloadMe = vi.fn<UserMeContextType['reloadMe']>().mockResolvedValueOnce(me()).mockResolvedValueOnce(null);

        await renderMyPage(me(), reloadMe);
        fireEvent.click(screen.getByRole('button', {name: '탈퇴 신청'}));
        await act(async () => {
            fireEvent.click(within(document.querySelector('dialog') as HTMLElement).getByRole('button', {name: '탈퇴 신청'}));
        });

        expect(leaveUser).toHaveBeenCalledTimes(1);
        expect(reloadMe).toHaveBeenCalledTimes(2);
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('요청은 보냈지만 처리 결과를 확인하지 못했어요. 잠시 뒤 다시 들어와 확인해 주세요.');
    });

    it('[FAIL:me] 내 정보를 못 읽었다 → "다시 불러오기" · 로그아웃은 보이고 탈퇴 신청은 없다', async () => {
        const reloadMe = vi.fn<UserMeContextType['reloadMe']>().mockResolvedValueOnce(null).mockResolvedValueOnce(null);

        await renderMyPage(null, reloadMe);
        expect(screen.getByText('내 정보를 불러오지 못했어요')).toBeTruthy();
        expect(screen.getByRole('button', {name: '로그아웃'})).toBeTruthy();
        expect(screen.queryByRole('button', {name: '탈퇴 신청'})).toBeNull();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '다시 불러오기'}));
        });

        expect(reloadMe).toHaveBeenCalledTimes(2);
        expect(showErrorPopup).toHaveBeenCalledTimes(1);
        expect(showErrorPopup).toHaveBeenCalledWith('내 정보를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    });

    it('[SUCCESS] 로그아웃한다 → 토큰 쿠키 삭제 1번 → 첫 화면 문서를 새로 연다', async () => {
        await renderMyPage(me(), vi.fn<UserMeContextType['reloadMe']>().mockResolvedValue(me()));

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '로그아웃'}));
        });

        expect(logout).toHaveBeenCalledTimes(1);
        expect(replaceDocument).toHaveBeenCalledTimes(1);
        expect(replaceDocument).toHaveBeenCalledWith('/');
        expect(showErrorPopup).not.toHaveBeenCalled();
    });

    it('[FAIL:logout] 토큰 쿠키를 지우지 못한다 → 안내, 이동하지 않는다', async () => {
        logout.mockResolvedValue(false);
        await renderMyPage(me(), vi.fn<UserMeContextType['reloadMe']>().mockResolvedValue(me()));

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '로그아웃'}));
        });

        expect(logout).toHaveBeenCalledTimes(1);
        expect(replaceDocument).not.toHaveBeenCalled();
        expect(showErrorPopup).toHaveBeenCalledWith('로그아웃하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
        expect((screen.getByRole('button', {name: '로그아웃'}) as HTMLButtonElement).disabled).toBe(false);
    });
});
