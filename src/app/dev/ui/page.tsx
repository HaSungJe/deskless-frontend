import { notFound } from 'next/navigation';
import UiPreviewContent from './UiPreviewContent';

// 개발 전용 — 공통 UI 부품 미리보기 (운영 404)
export default function UiPreview(): React.ReactNode {
    if (process.env.NODE_ENV === 'production') {
        notFound();
    }

    return (
        // 미리보기 화면
        <UiPreviewContent />
    );
}
