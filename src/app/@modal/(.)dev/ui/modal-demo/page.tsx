import RouteModal from '@/shared/components/ui/modal/RouteModal';
import ModalDemoContent from '@/app/dev/ui/modal-demo/ModalDemoContent';

// 경로 모달 예시(가로채기, 개발 전용) — 보통 페이지는 src/app/dev/ui/modal-demo/page.tsx
export default function ModalDemoIntercept(): React.ReactNode {
    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    return (
        // 팝업 — 닫으면 /dev/ui 로
        <RouteModal title="경로 모달 예시">
            {/* 예시 내용 */}
            <ModalDemoContent />
        </RouteModal>
    );
}
