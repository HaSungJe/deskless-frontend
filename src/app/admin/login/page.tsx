import { firstQueryValue } from '@/shared/utils/util';
import AdminLoginContent from './AdminLoginContent';

// A1 관리자 로그인 — /admin/login (로그인 전 화면, 콘솔 틀 밖)
export default async function AdminLogin({searchParams}: PageProps<'/admin/login'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 관리자 로그인
        <AdminLoginContent returnUrl={firstQueryValue(query.return_url)} />
    );
}
