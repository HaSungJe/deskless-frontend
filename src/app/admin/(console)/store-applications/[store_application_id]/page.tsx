import AdminApplicationDetailContent from './AdminApplicationDetailContent';

// A3 입점 신청 상세 — /admin/store-applications/[store_application_id] (콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default async function AdminApplicationDetail({params}: PageProps<'/admin/store-applications/[store_application_id]'>): Promise<React.ReactNode> {
    const {store_application_id} = await params;

    return (
        // 입점 신청 상세
        <AdminApplicationDetailContent applicationId={store_application_id} />
    );
}
