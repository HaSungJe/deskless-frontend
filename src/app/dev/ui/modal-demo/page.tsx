import { notFound } from 'next/navigation';
import ModalDemoContent from './ModalDemoContent';

// 경로 모달 예시의 보통 페이지 — 새로고침 · 직접 접속 (개발 전용, 운영 404)
export default function ModalDemo(): React.ReactNode {
    if (process.env.NODE_ENV === 'production') {
        notFound();
    }

    return (
        // 예시 내용을 보통 페이지로
        <ModalDemoContent />
    );
}
