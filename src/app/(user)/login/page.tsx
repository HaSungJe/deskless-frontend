import { firstQueryValue } from '@/shared/utils/util';
import LoginContent from './LoginContent';

// U5 로그인 — /login (카카오 · 네이버)
export default async function Login({searchParams}: PageProps<'/login'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 로그인 화면
        <LoginContent returnUrl={firstQueryValue(query.return_url)} error={firstQueryValue(query.error)} />
    );
}
