import Link from 'next/link';
import { lookupName } from '@/contracts/common/lookup';
import { StoreMyApplicationItemResultDto } from '@/contracts/store/dto/store-my-application-list.dto';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import Badge from '@/shared/components/ui/display/Badge';
import { formatBusinessNumber, formatKoreanDate } from '@/shared/utils/format';
import { storeConsoleLoginUrl } from '@/app/manager/manager-auth';
import { applicationStateTone } from '../store-application-format';
import styles from '@/app/css/user/StoreApplicationListContent.module.css';

type ApplicationCardProps = {
    item: StoreMyApplicationItemResultDto; // 신청 한 건
};

/** 업체코드 앞 몇 자만 — 시안은 "3f9a2c7e…"(전체는 title) */
const CODE_PREVIEW = 8;

/**
 * 신청 카드 — 이름 · 상태 · 사업자등록번호 · 신청일, 반려면 사유, 승인이면 업체코드 · 로그인 주소 · 복사(시안 user.html U11 목록)
 * - 승인 카드는 복사 버튼이 있어 이름만 링크, 그 밖은 카드 전체가 링크
 *
 * @param param0
 * @returns
 */
export default function ApplicationCard({item}: ApplicationCardProps): React.ReactNode {
    // 계산 값
    const href = `/store-applications/${encodeURIComponent(item.store_application_id)}/`;                                   // 상세
    const meta = `사업자등록번호 ${formatBusinessNumber(item.business_number)} · 신청일 ${formatKoreanDate(item.created_at)}`;   // 둘째 줄
    const badge = <Badge tone={applicationStateTone(item.store_application_state_id)}>{lookupName('store_application_state_id', item.store_application_state_id)}</Badge>; // 상태

    if (item.store_code) {
        const loginUrl = storeConsoleLoginUrl(item.store_code); // 업체 콘솔 로그인 주소
        return (
            // 승인 — 이름만 링크
            <div className={styles.card}>
                <div className={styles.head}><Link href={href} className={styles.name}>{item.store_name}</Link>{badge}</div>
                <span className={styles.meta}>{meta}</span>
                <div className={styles.approved}>
                    <div className={styles.approvedRow}>
                        <span className={styles.approvedLabel}>업체코드</span>
                        <span className={styles.code} title={item.store_code}>{item.store_code.slice(0, CODE_PREVIEW)}…</span>
                    </div>
                    <span className={styles.approvedLabel}>업체 관리자 콘솔 로그인 주소</span>
                    <span className={styles.url}>{loginUrl}</span>
                    <p className={styles.approvedText}>이 주소에서 신청 때 정한 아이디 · 비밀번호로 로그인하세요.</p>
                    <CopyButton text={loginUrl} label="로그인 주소 복사" size="md" full />
                </div>
            </div>
        );
    }

    return (
        // 대기 · 반려 — 카드 전체가 링크
        <Link href={href} className={styles.card}>
            <div className={styles.head}><strong className={styles.name}>{item.store_name}</strong>{badge}</div>
            <span className={styles.meta}>{meta}</span>
            {item.reject_comment ? (
                <div className={styles.reject}>
                    <span className={styles.rejectLabel}>반려 사유</span>
                    <p className={styles.rejectText}>{item.reject_comment}</p>
                </div>
            ) : null}
        </Link>
    );
}
