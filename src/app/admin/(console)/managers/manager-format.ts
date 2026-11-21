import { MANAGER_AUTH_BADGE } from '@/app/manager/manager-auth';
import { STORE_STATE } from '@/contracts/common/store.constants';
import { ManagerAccountDetailResultDto } from '@/contracts/manager/dto/manager-account-detail.dto';

/** 비밀번호 초기화 판단 — 켤지 · 막는 이유 */
export type PasswordResetType = {
    allowed: boolean;      // 초기화 버튼 켬
    reason: string | null; // 막는 이유(켜면 null)
};

/** 업체 ID 모양 — ManagerAccountListDto store_id(32자 소문자 16진수) */
const STORE_ID_PATTERN = /^[a-f0-9]{32}$/;

/**
 * 비밀번호를 초기화할 수 있는지 — 탈퇴 업체 계정 · 휴대폰 없는 계정은 막고 이유(정지 계정은 된다 — 지침서 A5)
 * - 탈퇴 업체를 먼저 본다 — 탈퇴 업체 계정은 휴대폰이 있어도 백엔드가 400 이라 휴대폰 이유보다 탈퇴 이유가 맞다
 *
 * @param account 업체 관리자 상세 — 휴대폰 · 업체 상태
 */
export function passwordResetOf(account: Pick<ManagerAccountDetailResultDto, 'phone' | 'store_state_id'>): PasswordResetType {
    if (account.store_state_id === STORE_STATE.LEAVE) {
        return {allowed: false, reason: '탈퇴한 업체의 계정이라 초기화할 수 없습니다.'};
    }

    if (!account.phone) {
        return {allowed: false, reason: '휴대폰 번호가 등록되지 않은 계정입니다. 그 업체의 업체 총관리자가 휴대폰 번호를 넣은 뒤 초기화할 수 있습니다.'};
    }

    return {allowed: true, reason: null};
}

/**
 * 권한 배지 색 — 업체 콘솔과 같은 색(총괄매니저 primary · 매니저 neutral)
 *
 * @param authId auth_id
 */
export function managerAuthTone(authId: string): 'primary' | 'neutral' {
    return MANAGER_AUTH_BADGE.get(authId)?.tone ?? 'neutral';
}

/**
 * 주소의 업체 ID — 업체 상세의 "이 업체의 업체 관리자"(?store_id=), 없거나 모양이 틀리면 null(전체 업체 — 백엔드 400 팝업 대신)
 *
 * @param value searchParams.store_id
 */
export function storeIdOf(value: string | Array<string> | undefined): string | null {
    return typeof value === 'string' && STORE_ID_PATTERN.test(value) ? value : null;
}
