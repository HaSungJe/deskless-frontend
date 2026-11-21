'use client';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { MEMBER_STATE, memberStateTone } from '@/contracts/common/member.constants';
import { getUsers } from '@/contracts/user/api';
import { UserListDto, UserListResultDto } from '@/contracts/user/dto/user-list.dto';
import { handleApiError } from '@/shared/api/error';
import Badge from '@/shared/components/ui/display/Badge';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPhone, toKst } from '@/shared/utils/format';
import { listNumber } from '@/shared/utils/util';
import { userPath } from '../admin-paths';
import { FilterOptionType } from '../_components/FilterChips';
import FilterSelect from '../_components/FilterSelect';
import ListFilter, { FIRST_LIST_QUERY, ListQueryType } from '../_components/ListFilter';
import styles from '@/app/css/admin/AdminList.module.css';

/** 이용자 목록 거르기 — 상태 · 검색어 · 쪽 + SNS */
type UserQueryType = ListQueryType & {
    sns: string | null; // 가입 SNS(null 이 전체)
};

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 상태 칩 — 시안 A6(전체 · 정상 · 정지 · 탈퇴 대기 · 탈퇴) */
const STATE_CHIPS: ReadonlyArray<FilterOptionType> = [
    {value: null, label: '전체'},
    {value: MEMBER_STATE.ACTIVE, label: '정상'},
    {value: MEMBER_STATE.BLOCK, label: '정지'},
    {value: MEMBER_STATE.LEAVE_WAIT, label: '탈퇴 대기'},
    {value: MEMBER_STATE.LEAVE, label: '탈퇴'},
];

/** SNS 고르기 — 시안 A6 순서(지금 가입은 카카오 · 네이버만, 고르기는 6종) */
const SNS_OPTIONS: ReadonlyArray<FilterOptionType> = [
    {value: null, label: '전체 SNS'},
    ...['KAKAO', 'NAVER', 'GOOGLE', 'APPLE', 'FACEBOOK', 'LINE'].map((snsId) => ({value: snsId, label: lookupName('sns_id', snsId)})),
];

/**
 * A6 이용자 목록 — 상태 · SNS · 검색 · 표(가입 최신순)
 * - 회원 ID · 검색 코드는 보이지 않는다 — 줄 번호는 검색 결과 기준(listNumber)
 *
 * @returns
 */
export default function AdminUserListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 관리자 토큰
    const loadPage = useEffectEvent((query: UserQueryType, signal: AbortSignal) => getUsers(auth, new UserListDto({page: query.page, size: PAGE_SIZE, state_id: query.state, sns_id: query.sns, keyword: query.keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [query, setQuery] = useState<UserQueryType>({...FIRST_LIST_QUERY, sns: null}); // ①②③ 상태 · SNS · 검색어 · 쪽
    const [result, setResult] = useState<UserListResultDto | null>(null);                 // ① 목록

    // 효과
    useEffect(() => {
        // ①②③ 그 거르기 · 쪽 목록(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(query, controller.signal).then((next) => {
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
    }, [query]);

    return (
        // 이용자 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>이용자</h1>
                <p className={styles.subtitle}>SNS 로 가입한 이용자입니다. 가입 최신순.</p>
            </div>

            {/* ② 거르기 — 상태 · SNS · 검색 */}
            <ListFilter
                stateLabel="회원 상태"
                states={STATE_CHIPS}
                placeholder="이름 · 닉네임 · 휴대폰 · 검색 코드"
                query={query}
                onChange={setQuery}
                trailing={<FilterSelect id="user-sns" label="SNS" options={SNS_OPTIONS} value={query.sns} onPick={(sns) => setQuery((prev) => ({...prev, sns, page: 1}))} />}
            />

            {/* ① 표 · 빈 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="조건에 맞는 이용자가 없습니다." description="거르기를 풀거나 검색어를 지워 보세요." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">번호</th><th scope="col">닉네임</th><th scope="col">이름</th><th scope="col">휴대폰</th><th scope="col">SNS</th><th scope="col">상태</th><th scope="col">가입일시</th></tr></thead>
                    <tbody>
                        {result.list.map((user, index) => {
                            const unverified = !user.phone && user.state_id !== MEMBER_STATE.LEAVE && user.is_phone_verified === 0; // 휴대폰 미인증 — 탈퇴는 "—"
                            return (
                                <tr key={user.user_id}>
                                    <td className={styles.number}>{listNumber(result.pagination, index)}</td>
                                    <td><Link href={userPath(user.user_id)}>{user.nickname}</Link></td>
                                    <td>{user.name}</td>
                                    <td className={styles.number}>{user.phone ? formatPhone(user.phone) : unverified ? <Badge>미인증</Badge> : '—'}</td>
                                    <td>{lookupName('sns_id', user.sns_id) || '—'}</td>
                                    <td><Badge tone={memberStateTone(user.state_id)}>{lookupName('state_id', user.state_id)}</Badge></td>
                                    <td className={styles.number}>{toKst(user.created_at, 'YYYY-MM-DD HH:mm')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            ) : null}

            {/* ③ 페이지 */}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setQuery((prev) => ({...prev, page: Number(next)}))} label="이용자 페이지" />
        </div>
    );
}
