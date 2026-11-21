import AdminManagerListContent from './AdminManagerListContent';
import { storeIdOf } from './manager-format';

// A5 업체 관리자 목록 — /admin/managers (?store_id= — 업체 상세의 "이 업체의 업체 관리자", 콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default async function AdminManagerList({searchParams}: PageProps<'/admin/managers'>): Promise<React.ReactNode> {
    const {store_id} = await searchParams;
    const storeId = storeIdOf(store_id);

    return (
        // 업체 관리자 목록 — 주소의 업체가 바뀌면(메뉴로 다시 오면) 거르기를 처음부터
        <AdminManagerListContent key={storeId ?? 'all'} storeId={storeId} />
    );
}
