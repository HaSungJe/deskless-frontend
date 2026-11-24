import AuthGuard from '@/shared/components/AuthGuard';
import ChatContent from './ChatContent';

// 여행 도우미 — /chat (이용자 로그인 필요, 지도에서 열면 src/app/@modal/(.)chat 이 팝업으로 가로챈다 — 이 page 는 새로고침 · 직접 접속)
export default function Chat(): React.ReactNode {
    return (
        // 로그인한 이용자만
        <AuthGuard>
            <ChatContent />
        </AuthGuard>
    );
}
