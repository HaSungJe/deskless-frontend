import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import SignupContent from '@/app/(user)/signup/SignupContent';
import { ApiError } from '@/shared/api/request';

const {replace, signWithSns, showErrorPopup} = vi.hoisted(() => ({replace: vi.fn(), signWithSns: vi.fn(), showErrorPopup: vi.fn()}));

vi.mock('next/navigation', () => ({useRouter: () => ({replace})}));
vi.mock('@/contracts/user/api', () => ({signWithSns}));
vi.mock('@/shared/utils/error-popup', () => ({showErrorPopup}));

/**
 * 칸 옆 오류 span
 *
 * @param name 칸 이름
 */
function fieldError(name: string): HTMLElement {
    return document.querySelector(`span[data-type="validation-alert"][data-id="${name}"]`) as HTMLElement;
}

/**
 * 칸 채우기
 *
 * @param values 성별 · 생년월일 · 닉네임(빈 값이면 건드리지 않음)
 */
function fill(values: {gender?: '남' | '여'; birth?: string; nickname?: string}): void {
    if (values.gender) {
        fireEvent.click(screen.getByRole('radio', {name: values.gender}));
    }
    if (values.birth !== undefined) {
        fireEvent.change(screen.getByLabelText('생년월일'), {target: {value: values.birth}});
    }
    if (values.nickname !== undefined) {
        fireEvent.change(screen.getByLabelText('닉네임'), {target: {value: values.nickname}});
    }
}

/**
 * "가입하기"
 */
async function submit(): Promise<void> {
    await act(async () => {
        fireEvent.click(screen.getByRole('button', {name: '가입하기'}));
    });
}

beforeEach(() => {
    replace.mockClear();
    signWithSns.mockReset();
    showErrorPopup.mockClear();
});

describe('SignupContent', () => {
    it('[FAIL:validation] 닉네임 특수문자 · 성별 없음이면 칸 옆 오류 — route 를 부르지 않는다', async () => {
        render(<SignupContent sns="KAKAO" returnUrl="/stores/1/" />);
        fill({birth: '19980314', nickname: '고양이!'});

        await submit();

        expect(signWithSns).not.toHaveBeenCalled();
        expect(fieldError('nickname').innerText).toBe('닉네임에 특수문자는 사용할 수 없습니다.');
        expect(fieldError('gender').innerText).toMatch(/성별/);
        expect(replace).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 숫자만 친 생년월일이 YYYY-MM-DD 로 — 가입하면 휴대폰 인증으로', async () => {
        signWithSns.mockResolvedValue({state: 'ok', is_phone_verified: 0});
        render(<SignupContent sns="KAKAO" returnUrl="/stores/1/" />);
        fill({gender: '여', birth: '19980314', nickname: '여행하는고양이'});

        expect((screen.getByLabelText('생년월일') as HTMLInputElement).value).toBe('1998-03-14');
        expect(screen.getByText('카카오')).toBeTruthy();
        expect(screen.getByText('7/12')).toBeTruthy();
        expect((screen.getByRole('radio', {name: '여'}) as HTMLInputElement).checked).toBe(true);
        await submit();

        expect(signWithSns).toHaveBeenCalledTimes(1);
        expect(signWithSns).toHaveBeenCalledWith({gender: 'F', birth: '1998-03-14', nickname: '여행하는고양이'});
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith('/phone-verification/?return_url=%2Fstores%2F1%2F');
        expect((screen.getByRole('button', {name: '가입하기'}) as HTMLButtonElement).disabled).toBe(true);
    });

    it('[FAIL:server] 백엔드 칸 오류(미성년 birth)는 칸 옆에 — 다른 화면으로 가지 않고 버튼을 다시 켠다', async () => {
        signWithSns.mockRejectedValue(new ApiError(400, {message: '입력값을 확인해주세요.', validation_errors: [{property: 'birth', message: '만 19세 이상만 가입할 수 있습니다.'}]}));
        render(<SignupContent sns="NAVER" returnUrl={null} />);
        fill({gender: '남', birth: '20100101', nickname: '고양이'});

        await submit();

        expect(signWithSns).toHaveBeenCalledTimes(1);
        expect(fieldError('birth').innerText).toBe('만 19세 이상만 가입할 수 있습니다.');
        expect(showErrorPopup).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
        expect((screen.getByRole('button', {name: '가입하기'}) as HTMLButtonElement).disabled).toBe(false);
    });

    it('[FAIL:no-sns] SNS 세션이 없으면 만료 안내 · 로그인으로(돌아갈 주소 유지)', async () => {
        signWithSns.mockResolvedValue({state: 'no-sns'});
        render(<SignupContent sns={null} returnUrl="/stores/1/" />);
        fill({gender: '남', birth: '1998-03-14', nickname: '고양이'});

        await submit();

        expect(showErrorPopup).toHaveBeenCalledWith('SNS 로그인 정보가 만료됐어요. 다시 로그인해 주세요.');
        expect(replace).toHaveBeenCalledWith('/login/?return_url=%2Fstores%2F1%2F');
    });
});
