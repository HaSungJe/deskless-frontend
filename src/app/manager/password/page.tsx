import AuthGuard from '@/shared/components/AuthGuard';
import { firstQueryValue } from '@/shared/utils/util';
import ManagerPasswordContent from './ManagerPasswordContent';

// M1 비밀번호 변경 — /manager/password (매니저 로그인 필요, 콘솔 틀 밖 — 시안대로 메뉴 없는 카드)
export default async function ManagerPassword({searchParams}: PageProps<'/manager/password'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 로그인한 매니저만
        <AuthGuard>
            <ManagerPasswordContent required={firstQueryValue(query.required) === '1'} />
        </AuthGuard>
    );
}
