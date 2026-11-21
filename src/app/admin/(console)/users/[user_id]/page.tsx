import AdminUserDetailContent from './AdminUserDetailContent';

// A6 이용자 상세 — /admin/users/[user_id] (콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default async function AdminUserDetail({params}: PageProps<'/admin/users/[user_id]'>): Promise<React.ReactNode> {
    const {user_id} = await params;

    return (
        // 이용자 상세
        <AdminUserDetailContent userId={user_id} />
    );
}
