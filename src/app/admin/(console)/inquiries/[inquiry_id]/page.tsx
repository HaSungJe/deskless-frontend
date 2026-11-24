import AdminInquiryDetailContent from './AdminInquiryDetailContent';

// 문의 상세(바로방 문의) — /admin/inquiries/[inquiry_id] (콘솔 틀 · 관리자 로그인 필요 — layout 이 감싼다)
export default async function AdminInquiryDetail({params}: PageProps<'/admin/inquiries/[inquiry_id]'>): Promise<React.ReactNode> {
    const {inquiry_id} = await params;

    return (
        // 문의 상세
        <AdminInquiryDetailContent inquiryId={inquiry_id} />
    );
}
