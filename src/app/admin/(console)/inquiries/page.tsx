import AdminInquiryListContent from './AdminInquiryListContent';

// 문의 목록(바로방 문의) — /admin/inquiries (콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default function AdminInquiryList(): React.ReactNode {
    return (
        // 문의 목록
        <AdminInquiryListContent />
    );
}
