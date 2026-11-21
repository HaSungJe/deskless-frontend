import AdminManagerDetailContent from './AdminManagerDetailContent';

// A5 업체 관리자 상세 — /admin/managers/[user_id] (콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default async function AdminManagerDetail({params}: PageProps<'/admin/managers/[user_id]'>): Promise<React.ReactNode> {
    const {user_id} = await params;

    return (
        // 업체 관리자 상세
        <AdminManagerDetailContent userId={user_id} />
    );
}
