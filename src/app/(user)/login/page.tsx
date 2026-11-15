import EmptyState from '@/shared/components/ui/display/EmptyState';

// U5 로그인 — /login (카카오 · 네이버 로그인은 Phase 5 에서 만든다)
export default function Login(): React.ReactNode {
    return (
        // 자리 표시
        <EmptyState title="로그인 화면을 준비하고 있습니다" description="카카오 · 네이버 로그인으로 곧 열립니다." />
    );
}
