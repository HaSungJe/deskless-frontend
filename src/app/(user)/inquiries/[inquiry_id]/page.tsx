import AuthGuard from '@/shared/components/AuthGuard';
import InquiryDetailContent from './InquiryDetailContent';

// 내 문의 상세 — /inquiries/[inquiry_id] (이용자 로그인 필요)
export default async function InquiryDetail({params}: PageProps<'/inquiries/[inquiry_id]'>): Promise<React.ReactNode> {
    const {inquiry_id} = await params;

    return (
        // 로그인한 이용자만
        <AuthGuard>
            <InquiryDetailContent inquiryId={inquiry_id} />
        </AuthGuard>
    );
}
