// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { APPLICANT_MISSING_MESSAGE, approvalOf, LICENSE_MISSING_MESSAGE } from '@/app/admin/(console)/store-applications/application-format';
import { StoreApplicationApplicantResultDto, StoreApplicationDetailFileResultDto } from '@/contracts/store/dto/store-application-detail.dto';

/** 신청자 */
const APPLICANT: StoreApplicationApplicantResultDto = {user_id: 'u'.repeat(32), name: '박진우', nickname: '홍대밤산책', phone: '01023456789'};

/**
 * 업체 정보 파일 하나
 *
 * @param purpose 용도
 */
function file(purpose: 'BUSINESS_LICENSE' | 'STORE_IMAGE'): StoreApplicationDetailFileResultDto {
    return {store_file_id: `${purpose}-file`, store_file_purpose_id: purpose, file_name: `${purpose}.jpg`, content_type: 'image/jpeg', is_private: purpose === 'BUSINESS_LICENSE' ? 1 : 0, file_url: 'https://cdn.example.com/f.jpg', created_at: '2026-11-09T12:16:00.000Z'};
}

describe('approvalOf — 승인할 수 있는지', () => {
    it('[SUCCESS] 대기 중이고 사업자등록증 · 신청자가 있으면 승인할 수 있다', () => {
        expect(approvalOf({store_application_state_id: 'WAIT', files: [file('BUSINESS_LICENSE'), file('STORE_IMAGE')], applicant: APPLICANT})).toEqual({visible: true, canApprove: true, blockedReason: null});
    });

    it('[FAIL:license] 사업자등록증이 없으면 승인을 막고 이유를 보인다', () => {
        expect(approvalOf({store_application_state_id: 'WAIT', files: [file('STORE_IMAGE')], applicant: APPLICANT})).toEqual({visible: true, canApprove: false, blockedReason: LICENSE_MISSING_MESSAGE});
        expect(LICENSE_MISSING_MESSAGE).toBe('사업자등록증이 없어 승인할 수 없습니다. 신청자가 내 신청 화면에서 사업자등록증을 올린 뒤 승인하세요.');
    });

    it('[FAIL:applicant] 신청자 정보가 없으면 승인을 막고 이유를 보인다', () => {
        expect(approvalOf({store_application_state_id: 'WAIT', files: [file('BUSINESS_LICENSE')], applicant: null})).toEqual({visible: true, canApprove: false, blockedReason: APPLICANT_MISSING_MESSAGE});
        expect(APPLICANT_MISSING_MESSAGE).toBe('신청자 정보를 찾을 수 없어 승인할 수 없습니다.');
    });

    it('[SUCCESS] 이미 처리된 신청이면 버튼을 숨긴다', () => {
        expect(approvalOf({store_application_state_id: 'REJECTED', files: [file('BUSINESS_LICENSE')], applicant: APPLICANT})).toEqual({visible: false, canApprove: false, blockedReason: null});
    });
});
