'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { MEMBER_STATE, memberStateTone } from '@/contracts/common/member.constants';
import { cancelLeave, leaveUser } from '@/contracts/user/api';
import { UserLeaveDto } from '@/contracts/user/dto/user-leave.dto';
import { handleApiError } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import ReasonModal from '@/shared/components/ui/modal/ReasonModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { RETURN_URL_KEY } from '@/shared/utils/area';
import { replaceDocument } from '@/shared/utils/base-path';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatKoreanDate, formatPhone } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import MemberStateBand from '../_components/MemberStateBand';
import { UserMeContext } from '../_components/UserMeProvider';
import UserTopBar from '../_components/UserTopBar';
import { INQUIRY_LIST_PATH } from '../inquiries/inquiry-format';
import pageStyles from '@/app/css/user/UserPage.module.css';
import styles from '@/app/css/user/MyPageContent.module.css';

/** 휴대폰 인증 — 인증 뒤 이 화면으로 */
const PHONE_VERIFY_PATH = `/phone-verification/?${RETURN_URL_KEY}=${encodeURIComponent('/me/')}`;

/** 탈퇴 사유 최대 글자 수 — UserLeaveDto */
const LEAVE_COMMENT_MAX = 255;

/** 내 정보를 다시 읽지 못함 */
const ME_LOAD_FAILED_MESSAGE = '내 정보를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.';

/** 탈퇴 · 철회 뒤 내 정보를 다시 읽지 못함 — 요청은 갔으니 늦어짐과 나눈다 */
const RESULT_UNCHECKED_MESSAGE = '요청은 보냈지만 처리 결과를 확인하지 못했어요. 잠시 뒤 다시 들어와 확인해 주세요.';

/** 토큰 쿠키를 지우지 못함 */
const LOGOUT_FAILED_MESSAGE = '로그아웃하지 못했어요. 잠시 뒤 다시 시도해 주세요.';

/** 아이콘 — 시안 U10 */
const PERSON_ICON = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>;
const CHEVRON_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>;

/**
 * U10 내 정보(시안의 "마이페이지" — 화면 이름은 사용자 2026-11-22 에 바꿈) — 내 정보 · 회원 상태 · 메뉴 · 로그아웃 · 탈퇴 신청 / 철회
 *
 * @returns
 */
export default function MyPageContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                       // 이용자 토큰 — 탈퇴 · 철회 · 로그아웃
    const {me, reloadMe} = useContext(UserMeContext);           // 내 정보 — 다시 읽으면 다른 화면의 회원 상태 띠도 같이 바뀐다
    const loadMe = useEffectEvent(() => reloadMe());            // 그때의 reloadMe 로(효과를 다시 걸지 않는다)

    // 상태
    const [leaveOpen, setLeaveOpen] = useState<boolean>(false); // 탈퇴 사유 창
    const [busy, setBusy] = useState<boolean>(false);           // 탈퇴 · 철회 · 로그아웃 · 다시 불러오기 중
    const [loaded, setLoaded] = useState<boolean>(false);       // 들어올 때 다시 읽기를 마쳤는지

    // 계산 값
    const leaving = me?.state_id === MEMBER_STATE.LEAVE_WAIT;                 // 탈퇴 대기 — 탈퇴 신청을 숨긴다
    const verified = me?.is_phone_verified === 1;                // 휴대폰 인증
    const unloaded = loaded && !me;                              // 내 정보를 못 읽음 — 다시 불러오기

    // 효과
    useEffect(() => {
        // ① 들어오면 내 정보를 다시 읽는다(앱을 연 뒤 회원 상태 · 휴대폰 인증이 바뀌었을 수 있다) — 못 읽으면 이전 값, 그것도 없으면 다시 불러오기
        let active = true;
        loadMe().then(() => {
            if (active) {
                setLoaded(true);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    // 함수
    async function retry(): Promise<void> {
        // 내 정보 다시 불러오기 — 또 못 읽으면 안내
        setBusy(true);
        const next = await reloadMe();
        setBusy(false);
        if (!next) {
            showErrorPopup(ME_LOAD_FAILED_MESSAGE);
        }
    }

    async function leave(reason: string): Promise<void> {
        // ④ 탈퇴 신청 — 사유(선택) → 큐 → 내 정보 다시(결과가 null 이라 상태로 확인)
        const dto = Object.assign(new UserLeaveDto(), reason ? {leave_comment: reason} : {});
        if (!(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서(React Compiler)
        try {
            await leaveUser(auth, dto);
        } catch (error) {
            failure = {error};
        }

        const next = await reloadMe();
        setBusy(false);
        setLeaveOpen(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        if (!next) {
            showErrorPopup(RESULT_UNCHECKED_MESSAGE);
            return;
        }

        if (next.state_id !== MEMBER_STATE.LEAVE_WAIT) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
        }
    }

    async function withdraw(): Promise<void> {
        // ④ 탈퇴 철회 — 큐 → 내 정보 다시
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await cancelLeave(auth);
        } catch (error) {
            failure = {error};
        }

        const next = await reloadMe();
        setBusy(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        if (!next) {
            showErrorPopup(RESULT_UNCHECKED_MESSAGE);
            return;
        }

        if (next.state_id === MEMBER_STATE.LEAVE_WAIT) {
            showErrorPopup(QUEUE_PENDING_MESSAGE);
        }
    }

    async function logout(): Promise<void> {
        // ⑤ 로그아웃 — 토큰 쿠키를 지우고 첫 화면 문서를 새로 연다(로그인 상태를 바꾸면 로그인 가드가 먼저 로그인 화면으로 보낸다)
        setBusy(true);
        const deleted = await auth.logout();
        if (!deleted) {
            setBusy(false);
            showErrorPopup(LOGOUT_FAILED_MESSAGE);
            return;
        }

        replaceDocument('/');
    }

    return (
        // 내 정보
        <div className={pageStyles.page}>
            {/* 머리 — 제목 · 홈으로 */}
            <UserTopBar title="내 정보" />

            {/* ③ 회원 상태 — 이용 제한 사유 · 탈퇴 대기(철회 버튼) */}
            <MemberStateBand me={me} action={<button type="button" className={styles.withdraw} disabled={busy} onClick={withdraw}>탈퇴 철회</button>} />

            <div className={pageStyles.body}>
                {me ? (
                    <>
                        {/* ② 프로필 */}
                        <section className={styles.profile}>
                            <span className={styles.avatar}>{PERSON_ICON}</span>
                            <div className={styles.profileText}>
                                <h2 className={styles.nickname}>{me.nickname}</h2>
                                <Badge tone={memberStateTone(me.state_id)}>{lookupName('state_id', me.state_id)}</Badge>
                            </div>
                        </section>

                        {/* ② 내 정보 */}
                        <section className={pageStyles.card} aria-labelledby="me-info-title">
                            <h2 id="me-info-title" className={pageStyles.cardTitle}>내 정보</h2>
                            <dl className={`${pageStyles.dl} ${styles.infoDl}`}>
                                <dt>가입한 SNS</dt><dd>{lookupName('sns_id', me.sns_id) || '-'}</dd>
                                <dt>휴대폰</dt>
                                <dd className={styles.phone}>
                                    {verified ? <>{formatPhone(me.phone)}<Badge tone="ok">인증 완료</Badge></> : <><Badge tone="warn">인증 전</Badge><Link href={PHONE_VERIFY_PATH} className={buttonClass({size: 'sm'})}>휴대폰 인증하기</Link></>}
                                </dd>
                                <dt>성별</dt><dd>{lookupName('gender', me.gender)}</dd>
                                <dt>생년월일</dt><dd>{formatKoreanDate(me.birth)}</dd>
                                <dt>가입일</dt><dd>{formatKoreanDate(me.created_at)}</dd>
                                {/* <dt>회원 식별 코드</dt><dd className={pageStyles.mono}>{me.user_search_code}</dd> */}
                            </dl>
                        </section>

                        {/* ② 메뉴 */}
                        <nav className={styles.menu} aria-label="내 정보 메뉴">
                            <Link href="/reservation/" className={styles.menuRow}>내 예약{CHEVRON_ICON}</Link>
                            <Link href="/store-applications/" className={styles.menuRow}>입점 신청{CHEVRON_ICON}</Link>
                            <Link href={INQUIRY_LIST_PATH} className={styles.menuRow}>문의{CHEVRON_ICON}</Link>
                        </nav>
                    </>
                ) : null}

                {/* 내 정보를 못 읽음 — 다시 불러오기(로그아웃은 아래에 그대로) */}
                {unloaded ? <EmptyState title="내 정보를 불러오지 못했어요" description="잠시 뒤 다시 불러와 주세요." action={<Button size="sm" disabled={busy} onClick={retry}>다시 불러오기</Button>} /> : null}

                {/* ⑤ 로그아웃(내 정보가 없어도 — 회색) · ④ 탈퇴 신청(내 정보가 있고 탈퇴 대기가 아닐 때 — 빨강) */}
                <Button variant="neutral" full disabled={busy} onClick={logout}>로그아웃</Button>
                {me && !leaving ? <Button variant="dangerSolid" full disabled={busy} onClick={() => setLeaveOpen(true)}>탈퇴 신청</Button> : null}
            </div>

            {/* 탈퇴 사유 */}
            <ReasonModal open={leaveOpen} title="탈퇴 신청" description="탈퇴를 신청하면 14일 뒤 탈퇴돼요. 그 전까지는 로그인해서 철회할 수 있어요." label="탈퇴 사유(선택)" name="leave_comment" maxLength={LEAVE_COMMENT_MAX} required={false} confirmLabel="탈퇴 신청" danger busy={busy} onConfirm={leave} onClose={() => setLeaveOpen(false)} />
        </div>
    );
}
