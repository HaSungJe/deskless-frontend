'use client';
import InquiryManageDetail from '@/app/_console/inquiries/InquiryManageDetail';

type ManagerInquiryDetailContentProps = {
    inquiryId: string; // 주소의 문의 ID
};

/**
 * 문의 상세(업체 관리자) — 콘솔 공통 화면에 영역 · 문의만 넘긴다
 *
 * @param param0
 * @returns
 */
export default function ManagerInquiryDetailContent({inquiryId}: ManagerInquiryDetailContentProps): React.ReactNode {
    return (
        // 문의 상세
        <InquiryManageDetail scope="manager" inquiryId={inquiryId} />
    );
}
