import UserLayoutContent from './UserLayoutContent';

type UserLayoutProps = {
    children: React.ReactNode;
};

// 이용자 영역 틀 — 모바일 폭 · 하단 탭 · 내 정보
export default function UserLayout({children}: UserLayoutProps): React.ReactNode {
    return (
        // 이용자 틀
        <UserLayoutContent>{children}</UserLayoutContent>
    );
}
