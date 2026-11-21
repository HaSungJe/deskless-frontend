import AdminApplicationListContent from './AdminApplicationListContent';

// A3 입점 신청 목록 — /admin/store-applications (콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default function AdminApplicationList(): React.ReactNode {
    return (
        // 입점 신청 목록
        <AdminApplicationListContent />
    );
}
