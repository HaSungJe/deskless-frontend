import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { firstQueryValue } from '@/shared/utils/util';
import { managerLoginPath, STORE_CODE_COOKIE } from '../manager-auth';
import ManagerLoginGuideContent from './ManagerLoginGuideContent';

// M1 업체 로그인 주소 안내 — /manager/login (기억한 업체코드가 있으면 그 업체 로그인으로 — httpOnly 쿠키라 서버에서 읽는다)
export default async function ManagerLoginGuide({searchParams}: PageProps<'/manager/login'>): Promise<React.ReactNode> {
    const query = await searchParams;
    const returnUrl = firstQueryValue(query.return_url);

    // ① 기억한 업체코드 → 그 업체 로그인(돌아갈 주소를 들고) — redirect() 는 basePath 를 Next 가 붙인다
    // - 직접 넣겠다고 왔으면(?manual=1 — 없는 업체 안내) 보내지 않는다(기억한 업체가 그 업체면 같은 안내로 되돌아가지 않게)
    const manual = firstQueryValue(query.manual) === '1';
    const remembered = manual ? null : managerLoginPath((await cookies()).get(STORE_CODE_COOKIE)?.value ?? '', returnUrl);
    if (remembered) {
        redirect(remembered);
    }

    return (
        // ② 없으면 안내
        <ManagerLoginGuideContent returnUrl={returnUrl} />
    );
}
