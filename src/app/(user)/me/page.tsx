import AuthGuard from '@/shared/components/AuthGuard';
import MyPageContent from './MyPageContent';

// U10 마이페이지 — /me (이용자 로그인 필요)
export default function MyPage(): React.ReactNode {
    return (
        // 로그인한 이용자만
        <AuthGuard>
            <MyPageContent />
        </AuthGuard>
    );
}
