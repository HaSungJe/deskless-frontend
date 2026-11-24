import ManagerInquiryDetailContent from './ManagerInquiryDetailContent';

// 문의 상세(내 업체 문의) — /manager/inquiries/[inquiry_id] (콘솔 틀 · 매니저 로그인 필요 — layout 이 감싼다)
export default async function ManagerInquiryDetail({params}: PageProps<'/manager/inquiries/[inquiry_id]'>): Promise<React.ReactNode> {
    const {inquiry_id} = await params;

    return (
        // 문의 상세
        <ManagerInquiryDetailContent inquiryId={inquiry_id} />
    );
}
