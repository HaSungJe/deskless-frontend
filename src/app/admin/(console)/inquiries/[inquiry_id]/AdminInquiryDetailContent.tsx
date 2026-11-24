'use client';
import InquiryManageDetail from '@/app/_console/inquiries/InquiryManageDetail';

type AdminInquiryDetailContentProps = {
    inquiryId: string; // 주소의 문의 ID
};

/**
 * 문의 상세(관리자) — 콘솔 공통 화면에 영역 · 문의만 넘긴다
 *
 * @param param0
 * @returns
 */
export default function AdminInquiryDetailContent({inquiryId}: AdminInquiryDetailContentProps): React.ReactNode {
    return (
        // 문의 상세
        <InquiryManageDetail scope="admin" inquiryId={inquiryId} />
    );
}
