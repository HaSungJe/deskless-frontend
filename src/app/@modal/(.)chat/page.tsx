import AuthGuard from '@/shared/components/AuthGuard';
import RouteModal from '@/shared/components/ui/modal/RouteModal';
import { CHAT_NAME } from '@/app/(user)/chat/chat-format';
import ChatContent from '@/app/(user)/chat/ChatContent';

// 여행 도우미 — 지도에서 열면 지도 위 팝업(가로채기), 보통 페이지는 src/app/(user)/chat/page.tsx
export default function ChatIntercept(): React.ReactNode {
    return (
        // 팝업 — 닫으면 지도로(뒤로 가기), 로그인한 이용자만
        <RouteModal title={CHAT_NAME}>
            <AuthGuard>
                <ChatContent inModal />
            </AuthGuard>
        </RouteModal>
    );
}
