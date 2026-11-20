'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { createRoomGroup, getRoomGroups } from '@/contracts/room/api';
import { RoomGroupListDto, RoomGroupListResultDto } from '@/contracts/room/dto/room-group-list.dto';
import { RoomGroupResultDto } from '@/contracts/room/dto/room-group.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Input from '@/shared/components/ui/form/Input';
import Modal from '@/shared/components/ui/modal/Modal';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import RoomGroupForm from './_components/RoomGroupForm';
import { EMPTY_ROOM_GROUP_FORM, RoomGroupFormType, roomGroupPath, toRoomGroupDto, validateRoomGroup } from './room-group-format';
import styles from '@/app/css/manager/RoomGroupListContent.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 검색어 최대 글자 수 — RoomGroupListDto */
const KEYWORD_MAX = 100;

/**
 * M5 객실 그룹 목록 — 그룹명 검색 · 그룹 카드(→ 상세) · 그룹 등록 대화상자
 * - 검색은 제출한 검색어가 바뀔 때만 부른다(칸을 고치는 동안은 부르지 않는다)
 *
 * @returns
 */
export default function RoomGroupListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                                                                         // 매니저 토큰
    const router = useRouter();                                                                                                                                                                   // 등록 뒤 상세로
    const loadPage = useEffectEvent((page: number, keyword: string, signal: AbortSignal) => getRoomGroups(auth, new RoomGroupListDto({page, size: PAGE_SIZE, keyword: keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [keywordInput, setKeywordInput] = useState<string>('');               // ② 검색 칸
    const [keyword, setKeyword] = useState<string>('');                         // ② 제출한 검색어
    const [page, setPage] = useState<number>(1);                                // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                      // 다시 불러오기(등록이 늦어졌을 때)
    const [result, setResult] = useState<RoomGroupListResultDto | null>(null);  // ① 목록
    const [creating, setCreating] = useState<boolean>(false);                   // ③ 등록 대화상자
    const [form, setForm] = useState<RoomGroupFormType>(EMPTY_ROOM_GROUP_FORM); // ③ 등록 칸
    const [busy, setBusy] = useState<boolean>(false);                           // 등록 중

    // 계산 값
    const empty = result !== null && result.list.length === 0; // 빈 목록 — 검색 결과 없음 · 그룹 없음

    // 효과
    useEffect(() => {
        // ① 그 쪽 · 검색어 목록(떠나면 결과를 버린다)
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
    }, [page, keyword, reloadKey]);

    // 함수
    function search(event: React.FormEvent<HTMLFormElement>): void {
        // ② 검색어로 1쪽
        event.preventDefault();
        setKeyword(keywordInput.trim());
        setPage(1);
    }

    function openCreate(): void {
        // ③ 빈 칸으로 등록 대화상자
        setForm(EMPTY_ROOM_GROUP_FORM);
        setCreating(true);
    }

    async function create(): Promise<void> {
        // ④ 검사 → 등록(큐) → 그룹 ID 면 상세로, 늦어지면 닫고 목록 다시
        const dto = toRoomGroupDto(form);
        if (busy || !(await validateRoomGroup(dto))) {
            return;
        }

        setBusy(true);
        let created: RoomGroupResultDto | null = null; // 등록 결과 — 늦어지면 null
        let failure: {error: unknown} | null = null;   // 실패 — 처리는 try 밖에서
        try {
            created = await createRoomGroup(auth, dto);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error); // 그룹명이 겹치면 그룹명 칸 옆
            return;
        }

        if (created) {
            router.push(roomGroupPath(created.room_group_id));
            return;
        }

        setCreating(false);
        setPage(1);
        setReloadKey((key) => key + 1);
    }

    return (
        // 객실 그룹 목록
        <div className={styles.page}>
            {/* 머리 */}
            <div className={styles.head}>
                <div>
                    <h1 className={styles.title}>객실 그룹</h1>
                    <p className={styles.subtitle}>같은 구성 · 요금으로 파는 호실 묶음입니다. 사진 · 그룹 상품 · 기간 가격은 그룹마다 정합니다.</p>
                </div>
                <Button variant="primary" onClick={openCreate}>그룹 등록</Button>
            </div>

            {/* ② 검색 */}
            <form role="search" className={styles.search} onSubmit={search}>
                <div className={styles.searchField}>
                    <label className={styles.label} htmlFor="room-group-keyword">그룹명 검색</label>
                    <Input id="room-group-keyword" placeholder="그룹명" maxLength={KEYWORD_MAX} value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
                </div>
                <Button type="submit">검색</Button>
            </form>

            {/* ① 빈 목록 */}
            {empty && keyword ? <EmptyState title="검색한 그룹이 없습니다." /> : null}
            {empty && !keyword ? <EmptyState title="아직 객실 그룹이 없습니다." description="그룹 등록으로 첫 그룹을 만드세요." action={<Button size="sm" variant="primary" onClick={openCreate}>그룹 등록</Button>} /> : null}

            {/* ① 그룹 카드 */}
            {result && result.list.length > 0 ? (
                <div className={styles.cards}>
                    {result.list.map((group) => (
                        <Link key={group.room_group_id} href={roomGroupPath(group.room_group_id)} className={styles.card}>
                            <span className={styles.image}>
                                {group.image_url ? <Image src={group.image_url} alt={`대표 사진 · ${group.room_group_name}`} fill sizes="(max-width: 600px) 100vw, 320px" unoptimized className={styles.img} /> : <span className={styles.noImage}>사진 없음</span>}
                            </span>
                            <span className={styles.body}>
                                <b>{group.room_group_name}</b>
                                <span>호실 {group.room_count}개 · 등록 {toKst(group.created_at, 'YYYY-MM-DD')}</span>
                            </span>
                        </Link>
                    ))}
                </div>
            ) : null}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="객실 그룹 페이지" />

            {/* ③④ 그룹 등록 */}
            <Modal open={creating} title="그룹 등록" onClose={() => setCreating(false)} footer={<><Button onClick={() => setCreating(false)}>취소</Button><Button variant="primary" disabled={busy} onClick={create}>{busy ? '처리 중…' : '등록'}</Button></>}>
                <RoomGroupForm idPrefix="group-new" form={form} onChange={(patch) => setForm((prev) => ({...prev, ...patch}))} />
            </Modal>
        </div>
    );
}
