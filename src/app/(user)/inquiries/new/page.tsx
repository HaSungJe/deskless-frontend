import AuthGuard from '@/shared/components/AuthGuard';
import { firstQueryValue } from '@/shared/utils/util';
import InquiryFormContent from './InquiryFormContent';

// 문의하기 — /inquiries/new (이용자 로그인 필요, 업체 상세의 "이 업체에 문의"는 ?store_id=)
export default async function InquiryNew({searchParams}: PageProps<'/inquiries/new'>): Promise<React.ReactNode> {
    const query = await searchParams;

    return (
        // 로그인한 이용자만
        <AuthGuard>
            <InquiryFormContent storeId={firstQueryValue(query.store_id)} />
        </AuthGuard>
    );
}
