import { firstQueryValue } from '@/shared/utils/util';
import LoginContent from './LoginContent';
import { isTestLoginEnabled } from './test-login';

// U5 로그인 — /login (카카오 · 네이버, 개발 서버면 테스트 이용자 로그인)
export default async function Login({searchParams}: PageProps<'/login'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 로그인 화면 — 개발 서버인지는 서버에서 판단해 버튼을 보일지만 넘긴다
        <LoginContent returnUrl={firstQueryValue(query.return_url)} error={firstQueryValue(query.error)} testLogin={isTestLoginEnabled()} />
    );
}
