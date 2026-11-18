import ManagerFindLoginIdContent from './ManagerFindLoginIdContent';

// M1 아이디 찾기 — /manager/[store_code]/find-login-id (로그인 전 화면)
export default async function ManagerFindLoginId({params}: PageProps<'/manager/[store_code]/find-login-id'>): Promise<React.ReactNode> {
    const {store_code} = await params;

    return (
        // 아이디 찾기
        <ManagerFindLoginIdContent storeCode={store_code} />
    );
}
