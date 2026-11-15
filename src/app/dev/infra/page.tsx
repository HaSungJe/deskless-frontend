import { notFound } from 'next/navigation';
import InfraPreviewContent from './InfraPreviewContent';

// 개발 전용 — 공통 인프라 부품 미리보기(지도 · 주소 · 인증번호 · 사진 · 결제위젯) (운영 404)
export default function InfraPreview(): React.ReactNode {
    if (process.env.NODE_ENV === 'production') {
        notFound();
    }

    return (
        // 미리보기 화면
        <InfraPreviewContent />
    );
}
