import StoreDetailContent from './StoreDetailContent';

// U2 업체 상세 + 객실 그룹 — /stores/[store_id]
export default async function StoreDetail({params}: PageProps<'/stores/[store_id]'>): Promise<React.ReactNode> {
    const {store_id} = await params;

    return (
        // 업체 상세 화면
        <StoreDetailContent storeId={store_id} />
    );
}
