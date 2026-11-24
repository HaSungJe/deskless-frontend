import ManagerInquiryListContent from './ManagerInquiryListContent';

// 문의 목록(내 업체 문의) — /manager/inquiries (콘솔 틀 · 매니저 로그인 필요 — layout 이 감싼다)
export default function ManagerInquiryList(): React.ReactNode {
    return (
        // 문의 목록
        <ManagerInquiryListContent />
    );
}
