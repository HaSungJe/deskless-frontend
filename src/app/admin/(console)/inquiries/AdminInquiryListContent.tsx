'use client';
import InquiryManageList from '@/app/_console/inquiries/InquiryManageList';

/**
 * 문의 목록(관리자) — 콘솔 공통 화면에 영역만 넘긴다
 *
 * @returns
 */
export default function AdminInquiryListContent(): React.ReactNode {
    return (
        // 문의 목록
        <InquiryManageList scope="admin" />
    );
}
