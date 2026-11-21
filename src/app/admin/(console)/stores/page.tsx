import AdminStoreListContent from './AdminStoreListContent';

// A4 업체 목록 — /admin/stores (콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default function AdminStoreList(): React.ReactNode {
    return (
        // 업체 목록
        <AdminStoreListContent />
    );
}
