import Link from 'next/link';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import { buttonClass } from '@/shared/components/ui/button/Button';
import { MANAGER_GUIDE_MANUAL_PATH } from '../../manager-auth';

/**
 * 없는 업체 안내 — 로그인 칸 없이, 업체코드를 다시 넣는 안내 화면으로(기억한 업체로 보내지 않음)
 *
 * @returns
 */
export default function LoginStoreNotFound(): React.ReactNode {
    return (
        // 없는 업체
        <ConsoleAuthCard title="업체 로그인 주소를 확인해 주세요" description="업체를 찾을 수 없습니다. 업체 총관리자에게 받은 로그인 주소가 맞는지 확인해 주세요.">
            <Link href={MANAGER_GUIDE_MANUAL_PATH} className={buttonClass({variant: 'primary', full: true})}>업체코드 다시 입력</Link>
        </ConsoleAuthCard>
    );
}
