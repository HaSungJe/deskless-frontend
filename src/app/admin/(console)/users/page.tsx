import AdminUserListContent from './AdminUserListContent';

// A6 이용자 목록 — /admin/users (콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default function AdminUserList(): React.ReactNode {
    return (
        // 이용자 목록
        <AdminUserListContent />
    );
}
