import { firstQueryValue } from '@/shared/utils/util';
import SignupContent from './SignupContent';

// U5 가입 — /signup (SNS 로그인 뒤 가입 정보)
export default async function Signup({searchParams}: PageProps<'/signup'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 가입 화면
        <SignupContent sns={firstQueryValue(query.sns)} returnUrl={firstQueryValue(query.return_url)} />
    );
}
