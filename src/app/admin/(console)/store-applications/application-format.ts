import { STORE_APPLICATION_STATE, STORE_FILE_PURPOSE } from '@/contracts/common/store.constants';
import { StoreApplicationDetailResultDto } from '@/contracts/store/dto/store-application-detail.dto';

/** 사업자등록증이 없어 승인할 수 없음 — 시안 A3 · 서버도 400 */
export const LICENSE_MISSING_MESSAGE = '사업자등록증이 없어 승인할 수 없습니다. 신청자가 내 신청 화면에서 사업자등록증을 올린 뒤 승인하세요.';

/** 신청자 정보가 없어 승인할 수 없음 — 서버도 400 */
export const APPLICANT_MISSING_MESSAGE = '신청자 정보를 찾을 수 없어 승인할 수 없습니다.';

/** 승인 · 반려 버튼 */
export type ApprovalType = {
    visible: boolean;             // 반려 · 승인 버튼을 보일지 — 대기만
    canApprove: boolean;          // 승인 켜짐
    blockedReason: string | null; // 승인을 막은 이유(띠)
};

/** 방금 승인한 업체 — 큐 결과(늦으면 비어 있음) */
export type ApprovedStoreType = {
    store_id: string | null;   // 만든 업체 ID
    store_code: string | null; // 업체코드
};

/**
 * 승인할 수 있는지 — 대기 중인 신청만 버튼, 사업자등록증 · 신청자가 모두 있어야 승인
 *
 * @param detail 입점 신청 상세
 */
export function approvalOf(detail: Pick<StoreApplicationDetailResultDto, 'store_application_state_id' | 'files' | 'applicant'>): ApprovalType {
    if (detail.store_application_state_id !== STORE_APPLICATION_STATE.WAIT) {
        return {visible: false, canApprove: false, blockedReason: null};
    }

    const hasLicense = detail.files.some((file) => file.store_file_purpose_id === STORE_FILE_PURPOSE.LICENSE);
    const blockedReason = !hasLicense ? LICENSE_MISSING_MESSAGE : detail.applicant === null ? APPLICANT_MISSING_MESSAGE : null;
    return {visible: true, canApprove: blockedReason === null, blockedReason};
}

/**
 * 승인 띠에 쓸 업체 — 받은 결과, 없으면(큐가 늦음) 다시 읽은 상세, 둘 다 없으면 null
 *
 * @param approved 승인 결과
 * @param detail 다시 읽은 상세
 */
export function approvedStoreOf(approved: ApprovedStoreType, detail: Pick<StoreApplicationDetailResultDto, 'store_id' | 'store_code'> | null): {store_id: string; store_code: string} | null {
    if (approved.store_id && approved.store_code) {
        return {store_id: approved.store_id, store_code: approved.store_code};
    }

    return detail?.store_id && detail.store_code ? {store_id: detail.store_id, store_code: detail.store_code} : null;
}
