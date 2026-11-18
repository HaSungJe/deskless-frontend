import AuthGuard from '@/shared/components/AuthGuard';
import ManagerConsoleLayoutContent from './ManagerConsoleLayoutContent';

type ManagerConsoleLayoutProps = {
    children: React.ReactNode;
};

// 업체 관리자 콘솔 틀 — 매니저 로그인 필요(아니면 업체 로그인 주소 안내 → 기억한 업체 로그인)
export default function ManagerConsoleLayout({children}: ManagerConsoleLayoutProps): React.ReactNode {
    return (
        // 로그인한 매니저만
        <AuthGuard>
            <ManagerConsoleLayoutContent>{children}</ManagerConsoleLayoutContent>
        </AuthGuard>
    );
}
