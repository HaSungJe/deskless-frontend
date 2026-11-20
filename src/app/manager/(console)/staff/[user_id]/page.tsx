import StaffDetailContent from './StaffDetailContent';

// M8 업체 관리자 상세 — /manager/staff/[user_id] (콘솔 틀 · 매니저 로그인 필요 — layout 이 감싼다, 업체 총관리자만 — 화면이 막는다)
export default async function StaffDetail({params}: PageProps<'/manager/staff/[user_id]'>): Promise<React.ReactNode> {
    const {user_id} = await params;

    return (
        // 업체 관리자 상세
        <StaffDetailContent userId={user_id} />
    );
}
