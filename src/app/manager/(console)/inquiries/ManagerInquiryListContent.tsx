'use client';
import InquiryManageList from '@/app/_console/inquiries/InquiryManageList';

/**
 * 문의 목록(업체 관리자) — 콘솔 공통 화면에 영역만 넘긴다
 *
 * @returns
 */
export default function ManagerInquiryListContent(): React.ReactNode {
    return (
        // 문의 목록
        <InquiryManageList scope="manager" />
    );
}
