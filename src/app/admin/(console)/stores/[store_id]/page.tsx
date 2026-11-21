import AdminStoreDetailContent from './AdminStoreDetailContent';

// A4 업체 상세 — /admin/stores/[store_id] (콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default async function AdminStoreDetail({params}: PageProps<'/admin/stores/[store_id]'>): Promise<React.ReactNode> {
    const {store_id} = await params;

    return (
        // 업체 상세
        <AdminStoreDetailContent storeId={store_id} />
    );
}
