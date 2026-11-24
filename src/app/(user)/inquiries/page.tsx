import AuthGuard from '@/shared/components/AuthGuard';
import InquiryListContent from './InquiryListContent';

// 내 문의 목록 — /inquiries (이용자 로그인 필요)
export default function InquiryList(): React.ReactNode {
    return (
        // 로그인한 이용자만
        <AuthGuard>
            <InquiryListContent />
        </AuthGuard>
    );
}
