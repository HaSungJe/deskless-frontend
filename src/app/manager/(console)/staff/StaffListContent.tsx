'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { AUTH_ID } from '@/contracts/common/roles';
import { createManagerStaff, getManagerStaffs } from '@/contracts/manager/api';
import { ManagerStaffListDto, ManagerStaffListResultDto } from '@/contracts/manager/dto/manager-staff-list.dto';
import { ManagerStaffDto, ManagerStaffResultDto } from '@/contracts/manager/dto/manager-staff.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Modal from '@/shared/components/ui/modal/Modal';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { validateAction } from '@/shared/utils/validation';
import { MANAGER_AUTH_BADGE } from '../../manager-auth';
import { isHeadManager, ManagerConsoleContext } from '../manager-console-context';
import StaffFields from './_components/StaffFields';
import { EMPTY_STAFF_FORM, HEAD_MANAGER_ONLY_TITLE, STAFF_STATE_TONE, StaffFormType, staffPath } from './staff-format';
import styles from '@/app/css/manager/StaffListContent.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 검색어 최대 글자 수 — ManagerStaffListDto */
const KEYWORD_MAX = 100;

/** 아이디 최대 글자 수 — ManagerStaffDto */
const LOGIN_ID_MAX = 30;

/**
 * M8 업체 관리자 목록 — 검색 · 표(업체 총관리자 줄은 상세로 가지 않음) · 등록 대화상자. 업체 총관리자만
 *
 * @returns
 */
export default function StaffListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                                                                         // 매니저 토큰
    const {account, accountLoaded} = useContext(ManagerConsoleContext);                                                                                                                           // 로그인 때 기억한 계정 — 권한 · 다 읽었나
    const router = useRouter();                                                                                                                                                                   // 등록 뒤 상세로
    const loadPage = useEffectEvent((page: number, keyword: string, signal: AbortSignal) => getManagerStaffs(auth, new ManagerStaffListDto({page, size: PAGE_SIZE, keyword: keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [keywordInput, setKeywordInput] = useState<string>('');                 // ③ 검색 칸
    const [keyword, setKeyword] = useState<string>('');                           // ③ 제출한 검색어
    const [page, setPage] = useState<number>(1);                                  // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                        // ⑤ 다시 불러오기(등록이 늦어졌을 때)
    const [result, setResult] = useState<ManagerStaffListResultDto | null>(null); // ② 목록
    const [creating, setCreating] = useState<boolean>(false);                     // ④ 등록 대화상자
    const [loginId, setLoginId] = useState<string>('');                           // ④ 아이디 칸
    const [form, setForm] = useState<StaffFormType>(EMPTY_STAFF_FORM);            // ④ 이름 · 휴대폰 · 성별 · 생년월일 칸
    const [busy, setBusy] = useState<boolean>(false);                             // 등록 중

    // 계산 값
    const allowed = isHeadManager(account); // ① 업체 총관리자만(모르면 막음)

    // 효과
    useEffect(() => {
        // ② 그 쪽 · 검색어 목록 — 업체 총관리자가 아니면 부르지 않는다(떠나면 결과를 버린다)
        if (!allowed) {
            return;
        }

        const controller = new AbortController();
        loadPage(page, keyword, controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [allowed, page, keyword, reloadKey]);

    // 함수
    function search(event: React.FormEvent<HTMLFormElement>): void {
        // ③ 검색어로 1쪽
        event.preventDefault();
        setKeyword(keywordInput.trim());
        setPage(1);
    }

    function openCreate(): void {
        // ④ 빈 칸으로 등록 대화상자
        setLoginId('');
        setForm(EMPTY_STAFF_FORM);
        setCreating(true);
    }

    async function create(): Promise<void> {
        // ④ 검사 → 등록(큐) → ⑤ 회원 ID 면 상세로, 늦어지면 닫고 1쪽 다시
        const dto = Object.assign(new ManagerStaffDto(), {login_id: loginId.trim(), name: form.name.trim(), phone: form.phone, gender: form.gender, birth: form.birth});
        if (busy || !(await validateAction(dto))) {
            return;
        }

        setBusy(true);
        let created: ManagerStaffResultDto | null = null; // 등록 결과 — 늦어지면 null
        let failure: {error: unknown} | null = null;      // 실패 — 처리는 try 밖에서
        try {
            created = await createManagerStaff(auth, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // ⑤ 아이디 · 휴대폰이 겹치면 그 칸 옆
            return;
        }

        if (created) {
            router.push(staffPath(created.user_id));
            return;
        }

        setCreating(false);
        setPage(1);
        setReloadKey((key) => key + 1);
    }

    if (!accountLoaded) {
        // ① 계정 쿠키를 읽는 중 — 권한을 아직 모른다(안내를 먼저 보이지 않는다)
        return null;
    }

    if (!allowed) {
        return (
            // ① 업체 총관리자만
            <EmptyState title={HEAD_MANAGER_ONLY_TITLE} />
        );
    }

    return (
        // 업체 관리자 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div className={styles.head}>
                <div>
                    <h1 className={styles.title}>업체 관리자</h1>
                    <p className={styles.subtitle}>이 업체 콘솔에 로그인하는 계정입니다. 아이디 · 휴대폰 번호는 업체 안에서 겹칠 수 없습니다.</p>
                </div>
                <Button variant="primary" onClick={openCreate}>업체 관리자 등록</Button>
            </div>

            {/* ③ 검색 */}
            <form role="search" className={styles.search} onSubmit={search}>
                <div className={styles.searchField}>
                    <label className={styles.label} htmlFor="staff-keyword">검색</label>
                    <Input id="staff-keyword" placeholder="아이디 · 이름 · 휴대폰 번호" maxLength={KEYWORD_MAX} value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
                </div>
                <Button type="submit">검색</Button>
            </form>

            {/* ② 표 */}
            {result && result.list.length === 0 ? <EmptyState title="검색한 업체 관리자가 없습니다." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">아이디</th><th scope="col">이름</th><th scope="col">휴대폰</th><th scope="col">권한</th><th scope="col">상태</th><th scope="col">비밀번호 변경 필요</th><th scope="col">등록일</th></tr></thead>
                    <tbody>
                        {result.list.map((staff) => {
                            const head = staff.auth_id === AUTH_ID.HEAD_MANAGER;
                            const badge = MANAGER_AUTH_BADGE.get(staff.auth_id);
                            return (
                                <tr key={staff.user_id} className={head ? styles.mine : undefined}>
                                    <td>{head ? <b>{staff.login_id}</b> : <Link href={staffPath(staff.user_id)}>{staff.login_id}</Link>}</td>
                                    <td>{staff.name}</td>
                                    <td className={styles.number}>{staff.phone ? formatPhone(staff.phone) : '—'}</td>
                                    <td>{badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : staff.auth_id}</td>
                                    <td><Badge tone={STAFF_STATE_TONE[staff.state_id] ?? 'neutral'}>{lookupName('state_id', staff.state_id)}</Badge></td>
                                    <td>{staff.is_password_change_required === 1 ? <Badge tone="warn">필요</Badge> : '—'}</td>
                                    <td className={styles.number}>{toKst(staff.created_at, 'YYYY-MM-DD')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            ) : null}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="업체 관리자 페이지" />

            {/* ④⑤ 등록 */}
            <Modal open={creating} title="업체 관리자 등록" onClose={() => setCreating(false)} footer={<><Button onClick={() => setCreating(false)}>취소</Button><Button variant="primary" disabled={busy} onClick={create}>{busy ? '처리 중…' : '등록'}</Button></>}>
                <div className={styles.form}>
                    <Field label="아이디" name="login_id" htmlFor="staff-new-login-id" hint="영문 · 숫자 · _ 4~30자, 업체 안에서 겹치지 않게" required>
                        <Input id="staff-new-login-id" autoComplete="off" maxLength={LOGIN_ID_MAX} value={loginId} onChange={(event) => setLoginId(event.target.value)} />
                    </Field>
                    <StaffFields idPrefix="staff-new" form={form} onChange={(patch) => setForm((prev) => ({...prev, ...patch}))} />
                    <p className={styles.hint}>등록하면 업체코드 · 아이디 · 임시 비밀번호가 그 휴대폰으로 문자로 갑니다.</p>
                </div>
            </Modal>
        </div>
    );
}
