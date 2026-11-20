import StaffListContent from './StaffListContent';

// M8 업체 관리자 목록 — /manager/staff (콘솔 틀 · 매니저 로그인 필요 — layout 이 감싼다, 업체 총관리자만 — 화면이 막는다)
export default function Staff(): React.ReactNode {
    return (
        // 업체 관리자 목록
        <StaffListContent />
    );
}
