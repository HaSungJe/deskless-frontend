import AuthGuard from '@/shared/components/AuthGuard';
import AdminConsoleLayoutContent from './AdminConsoleLayoutContent';

type AdminConsoleLayoutProps = {
    children: React.ReactNode;
};

// 관리자 콘솔 틀 — 관리자 로그인 필요(아니면 관리자 로그인 — 돌아올 주소를 들고)
export default function AdminConsoleLayout({children}: AdminConsoleLayoutProps): React.ReactNode {
    return (
        // 로그인한 관리자만
        <AuthGuard>
            <AdminConsoleLayoutContent>{children}</AdminConsoleLayoutContent>
        </AuthGuard>
    );
}
