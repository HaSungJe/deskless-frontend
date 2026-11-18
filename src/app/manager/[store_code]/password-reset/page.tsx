import ManagerPasswordResetContent from './ManagerPasswordResetContent';

// M1 비밀번호 초기화 — /manager/[store_code]/password-reset (로그인 전 화면)
export default async function ManagerPasswordReset({params}: PageProps<'/manager/[store_code]/password-reset'>): Promise<React.ReactNode> {
    const {store_code} = await params;

    return (
        // 비밀번호 초기화
        <ManagerPasswordResetContent storeCode={store_code} />
    );
}
