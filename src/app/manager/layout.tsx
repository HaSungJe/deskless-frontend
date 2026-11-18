type ManagerLayoutProps = {
    children: React.ReactNode;
};

// 업체 관리자 영역 — 로그인 화면 · 콘솔 모두 콘솔 크기(글자 14 · 컨트롤 40)
export default function ManagerLayout({children}: ManagerLayoutProps): React.ReactNode {
    return (
        // 콘솔 크기 토큰
        <div data-area="console">{children}</div>
    );
}
