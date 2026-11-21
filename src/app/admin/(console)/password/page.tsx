import { firstQueryValue } from '@/shared/utils/util';
import AdminPasswordContent from './AdminPasswordContent';

// A1 비밀번호 변경 — /admin/password (콘솔 틀 안 · 관리자 로그인 필요 — layout 이 감싼다)
export default async function AdminPassword({searchParams}: PageProps<'/admin/password'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 비밀번호 변경
        <AdminPasswordContent required={firstQueryValue(query.required) === '1'} />
    );
}
