import { firstQueryValue } from '@/shared/utils/util';
import ManagerLoginContent from './ManagerLoginContent';

// M1 업체 로그인 — /manager/[store_code]/login (업체코드는 주소에, 로그인 전 화면)
export default async function ManagerLogin({params, searchParams}: PageProps<'/manager/[store_code]/login'>): Promise<React.ReactNode> {
    const {store_code} = await params;
    const query = await searchParams;

    return (
        // 업체 로그인
        <ManagerLoginContent storeCode={store_code} returnUrl={firstQueryValue(query.return_url)} />
    );
}
