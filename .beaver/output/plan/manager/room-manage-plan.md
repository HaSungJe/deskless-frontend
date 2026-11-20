# Plan — 상품 · 객실 — 상품 설정 · 객실 그룹 · 호실

> 무엇을·왜는 [spec](../../spec/manager/room-manage-spec.md)에 있다. 이 문서는 **어디를, 어떻게**를 적는다.
>
> **코드를 싣는 것** ① 화면마다 비즈니스 로직 전체 ② 계산 함수 ③ 규약만으로 예측할 수 없는 부분(변경 문서를 반영한 DTO · 같은 이름 칸 나누기 · 공용으로 옮기는 것)
> **싣지 않는 것** page 껍데기, 지침서 그대로인 DTO 사본, 형제와 같은 contracts 함수 — 따르는 패턴을 표 한 줄로 가리킨다

로드맵 Phase 12(#43 ~ #46 · #62)를 이 plan 하나로 만든다. 화면 4개(`/manager/plans` · `/manager/room-groups` · `/manager/room-groups/[room_group_id]` · `/manager/rooms`)는 모두 콘솔 틀(`manager/(console)/layout.tsx`) 안이라 로그인 가드 · 메뉴(`manager-menu.tsx:8-10`)는 이미 있다. 백엔드 변경 2건(`frontend/changes/2026-11-19-door-state-removed.md` · `2026-11-20-room-group-detail-floors.md`)을 함께 반영한다.

## 파일

| 파일 | 작업 | 역할 | 코드 |
|---|---|---|---|
| `src/contracts/room/dto/` 22개(지침서 `frontend/dto/room.md` 의 파일 그대로) | 신규 | 지침서 사본 — `room-door-open` · `room-list` · `room-group-detail` 3개는 변경 문서 모양 | 일부 (아래 3-1) |
| `src/contracts/room/api.ts` | 신규 | 객실 API 22개 | 생략 |
| `src/contracts/common/lookup.ts` | 수정 | `door_state` 룩업 지움(문 상태 없어짐) | 아래 3-1 |
| `src/shared/api/error.ts` | 수정 | `handleApiError(error, isReset, key?)` — 받은 칸 오류를 그 키의 칸에 | 아래 3-2 |
| `src/shared/components/ui/form/Select.tsx` | 신규 | 고르기 상자(한 줄 입력과 같은 모양) | 아래 3-3 |
| `src/shared/utils/util.ts` · `src/app/manager/(console)/store/store-settings-format.ts` · `_components/StorePolicyTab.tsx` · `_components/StoreHoursTab.tsx` | 수정 | `numberOf` 를 공용으로 옮김, 요일 이름 복제를 `format.ts` 것으로 | 아래 3-4 |
| `src/app/manager/(console)/plans/page.tsx` | 신규 | 얇은 page | 생략 |
| `src/app/manager/(console)/plans/PlansContent.tsx` · `_components/PlanCard.tsx` | 신규 | 상품 설정 — 카드 3개 · 카드 저장 | 아래 1-1 |
| `src/app/manager/(console)/plans/plan-format.ts` | 신규 | 상품 종류 · 카드 칸 · 상품 설정 보낼 값 | 아래 2-1 |
| `src/app/manager/(console)/room-groups/page.tsx` | 신규 | 얇은 page | 생략 |
| `src/app/manager/(console)/room-groups/RoomGroupListContent.tsx` · `_components/RoomGroupForm.tsx` | 신규 | 그룹 목록 · 검색 · 등록 대화상자, 목록 · 상세가 함께 쓰는 그룹 칸 | 아래 1-2 |
| `src/app/manager/(console)/room-groups/room-group-format.ts` | 신규 | 그룹 칸 ↔ DTO · 그룹 검사 · 주소 · 머리 호실 글자 | 아래 3-5 |
| `src/app/manager/(console)/room-groups/[room_group_id]/page.tsx` | 신규 | 얇은 page(주소의 그룹 ID) | 생략 |
| `src/app/manager/(console)/room-groups/[room_group_id]/RoomGroupDetailContent.tsx` · `_components/RoomGroupInfoCard.tsx` · `RoomGroupPhotos.tsx` · `RoomGroupPlans.tsx` | 신규 | 그룹 상세 — 머리 · 기본 정보 · 사진 · 그룹 상품 · 그룹 삭제 | 아래 1-3 |
| `src/app/manager/(console)/room-groups/[room_group_id]/_components/RoomGroupPrices.tsx` | 신규 | 상품별 기간 가격 | 아래 1-4 |
| `src/app/manager/(console)/rooms/page.tsx` | 신규 | 얇은 page | 생략 |
| `src/app/manager/(console)/rooms/RoomsContent.tsx` · `_components/RoomFormModal.tsx` · `RoomStateModal.tsx` | 신규 | 호실 — 거르기 · 표 · 등록 · 수정 · 상태 · 문 열기 · 삭제 | 아래 1-5 |
| `src/app/manager/(console)/rooms/room-format.ts` | 신규 | 마지막으로 연 시각 글자 · 층 이름 · 상태별 버튼 · 상태 배지 색 | 아래 2-2 |
| `src/app/css/manager/` — `PlansContent` · `PlanCard` · `RoomGroupListContent` · `RoomGroupForm` · `RoomGroupDetailContent` · `RoomGroupPlans` · `RoomGroupPrices` · `RoomsContent` `.module.css` | 신규 | 시안 값 | 아래 5 |
| 테스트 — 계산 2파일 · 화면 5파일 · `room-fixture.tsx` | 신규 | spec 23건 | 아래 테스트 |
| `AGENTS.md` · `docs/conventions.md` · `docs/error-handling.md` · `docs/data-layer.md` | 수정 | `Select` · 같은 이름 칸 나누기(`dataKey` · `handleApiError` key) · `numberOf` · 반영한 변경 2건 | 만드는 순서 8 |

---

## 1. 비즈니스 로직 — 화면별 코드

모든 쓰기는 같은 모양: 검사 → 큐(`try` 안은 `await` 만, 실패는 `handleApiError`) → 그 화면 조회를 다시(`reloadKey`). 큐 결과가 null(완료 · 늦어짐 같음)이어도 다시 불러 서버 값을 본다(spec 결정). 목록 · 상세 조회는 일시 예약불가 탭과 같은 효과 모양(`useEffectEvent` 가 값을 돌려주고, setState 는 효과 안 `.then`, 떠나면 `AbortController` — `src/app/manager/(console)/store/_components/StoreUnavailableTab.tsx:49-65`).

**같은 이름의 칸이 한 화면에 둘 이상이면 키로 나눈다**(spec 결정) — 상품 카드 3개 · 그룹 상품 줄 3개는 상품 종류(`HOURLY` …), 그룹의 방 개수는 `room_group_detail`, 기간 가격 대화상자는 `plan_price`. 그 칸은 `<Field dataKey>` · `<FieldError dataKey>`, 검사는 `resetValidationError()` 뒤 `validateActionChildren(dto, key)`, 받은 오류는 `handleApiError(error, true, key)`(아래 3-2). 이름이 한 번뿐인 칸(그룹명 · 호실 대화상자)은 지금처럼 `validateAction` · `handleApiError(error)`.

### 1-1. 상품 설정 — `PlansContent` · `PlanCard`

카드는 받은 값으로 칸을 한 번 채우고, 저장 뒤 다시 불러오면 `key` 의 `reloadKey` 가 바뀌어 새 값으로 다시 그린다. "저장했습니다." 는 다시 그려도 남도록 화면이 기억한다.

```tsx
// src/app/manager/(console)/plans/PlansContent.tsx
'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { getRoomPlans } from '@/contracts/room/api';
import { RoomPlanListResultDto } from '@/contracts/room/dto/room-plan-list.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import PlanCard from './_components/PlanCard';
import styles from '@/app/css/manager/PlansContent.module.css';

/**
 * M6 상품 설정 — 상품 3개(시간 이용 · 1박 · 연박) 카드, 카드마다 저장
 *
 * @returns
 */
export default function PlansContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                    // 매니저 토큰
    const loadPlans = useEffectEvent((signal: AbortSignal) => getRoomPlans(auth, signal)); // 그때의 auth 로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                       // 다시 불러오기(저장 뒤) — 카드 key 에도 쓴다
    const [result, setResult] = useState<RoomPlanListResultDto | null>(null);    // ① 상품 3개
    const [failed, setFailed] = useState<boolean>(false);                        // 못 읽음
    const [savedType, setSavedType] = useState<string | null>(null);             // ④ 방금 저장한 상품 — "저장했습니다."

    // 효과
    useEffect(() => {
        // ① 상품 설정 3개(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPlans(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setResult(next);
                setFailed(next === null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [reloadKey]);

    // 함수
    function reload(): void {
        // 다시 불러오기
        setReloadKey((key) => key + 1);
    }

    function onSaved(type: string): void {
        // ④ 저장 뒤 — 그 카드에 "저장했습니다." · 3개 다시
        setSavedType(type);
        reload();
    }

    return (
        // 상품 설정
        <div className={styles.page}>
            {/* 머리 */}
            <div>
                <h1 className={styles.title}>상품 설정</h1>
                <p className={styles.subtitle}>업체 전체에 걸리는 상품별 판매 · 요일 · 시간 · 연장 설정입니다. 그룹마다 판매 여부와 요금은 객실 그룹에서 정합니다.</p>
            </div>

            {/* ① 안내 띠 */}
            <Band tone="info">연장 설정은 이용자가 연장할 때의 지금 설정을 따릅니다. 판매하지 않는 상품은 그룹 상품을 켜도 팔리지 않습니다.</Band>

            {/* 못 읽음 */}
            {failed && !result ? <EmptyState title="상품 설정을 불러오지 못했어요" description="잠시 뒤 다시 불러와 주세요." action={<Button size="sm" onClick={reload}>다시 불러오기</Button>} /> : null}

            {/* ② 카드 3개 */}
            <div className={styles.plans}>
                {result?.list.map((plan) => <PlanCard key={`${plan.room_plan_type_id}-${reloadKey}`} plan={plan} saved={savedType === plan.room_plan_type_id} onSaved={onSaved} />)}
            </div>
        </div>
    );
}
```

```tsx
// src/app/manager/(console)/plans/_components/PlanCard.tsx
'use client';
import { useContext, useState } from 'react';
import { updateRoomPlan } from '@/contracts/room/api';
import { RoomPlanItemResultDto } from '@/contracts/room/dto/room-plan-list.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import Chip from '@/shared/components/ui/form/Chip';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { DAY_NAMES, formatDays } from '@/shared/utils/format';
import { resetValidationError, validateActionChildren } from '@/shared/utils/validation';
import { PLAN_TYPE, planFormOf, PlanFormType, toPlanUpdateDto } from '../plan-format';
import styles from '@/app/css/manager/PlanCard.module.css';

type PlanCardProps = {
    plan: RoomPlanItemResultDto;     // 상품 설정 1개
    saved: boolean;                  // 방금 저장한 카드 — "저장했습니다."
    onSaved: (type: string) => void; // 저장 뒤 — 3개 다시
};

/**
 * 상품 카드 — 판매 · 판매 요일 · 종류별 칸(이용 시간 · 입실 / 퇴실 · 박수) · 연장, 카드 저장
 * - 칸 오류는 상품 종류 키로 이 카드에만 붙인다(카드 3개가 같은 칸 이름)
 *
 * @param param0
 * @returns
 */
export default function PlanCard({plan, saved, onSaved}: PlanCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);  // 매니저 토큰
    const type = plan.room_plan_type_id;   // 상품 종류 — 칸 오류 키 · 칸 id 앞

    // 상태
    const [form, setForm] = useState<PlanFormType>(() => planFormOf(plan)); // 칸 값 — 받은 값으로 한 번
    const [saving, setSaving] = useState<boolean>(false);                    // 저장 중

    // 계산 값
    const daysText = form.days_of_week === 0 ? '고른 요일 없음' : formatDays(form.days_of_week); // ② 고른 요일 글자
    const isHourly = type === PLAN_TYPE.HOURLY;                                                    // 시간 이용 — 이용 시간
    const isLong = type === PLAN_TYPE.LONG;                                                        // 연박 — 박수 · 시각 설명

    // 함수
    function change(patch: Partial<PlanFormType>): void {
        // 칸 바꿈
        setForm((prev) => ({...prev, ...patch}));
    }

    function toggleDay(day: number): void {
        // ② 요일 칩 — 그 요일 비트를 뒤집는다
        setForm((prev) => ({...prev, days_of_week: prev.days_of_week ^ (1 << day)}));
    }

    async function save(): Promise<void> {
        // ③ 종류에 맞는 칸만 모아 검사(이 카드 키) → 저장(큐) → ④ 저장했습니다 · 다시
        if (saving) {
            return;
        }

        const dto = toPlanUpdateDto(type, form);
        resetValidationError();
        if (!(await validateActionChildren(dto, type))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateRoomPlan(auth, type, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error, true, type); // ④ 입실 = 퇴실 · 최소 > 최대 — 이 카드 칸 옆
            return;
        }

        onSaved(type);
    }

    return (
        // 상품 카드
        <Card title={plan.room_plan_type_name} actions={<Switch label="판매" checked={form.is_used} onChange={(checked) => change({is_used: checked})} />}>
            {/* ② 판매 요일 */}
            <Field label={`판매 요일 · ${daysText}`} name="days_of_week" dataKey={type} group>
                <div className={styles.days}>
                    {DAY_NAMES.map((name, day) => <Chip key={name} pressed={(form.days_of_week & (1 << day)) !== 0} onClick={() => toggleDay(day)}>{name}</Chip>)}
                </div>
            </Field>

            {/* ② 시간 이용 — 이용 시간 */}
            {isHourly ? (
                <Field label="이용 시간" name="usage_hours" dataKey={type} htmlFor={`${type}-usage-hours`}>
                    <div className={styles.unit}><Input id={`${type}-usage-hours`} type="number" min={1} max={24} value={form.usage_hours} onChange={(event) => change({usage_hours: event.target.value})} /><span>시간 (1 ~ 24)</span></div>
                </Field>
            ) : null}

            {/* ② 1박 · 연박 — 입실 · 퇴실, 연박은 박수 */}
            {!isHourly ? (
                <div className={styles.grid}>
                    <Field label="입실 시각" name="check_in_time" dataKey={type} htmlFor={`${type}-check-in`} hint={isLong ? '첫날' : undefined}>
                        <Input id={`${type}-check-in`} type="time" value={form.check_in_time} onChange={(event) => change({check_in_time: event.target.value})} />
                    </Field>
                    <Field label="퇴실 시각" name="check_out_time" dataKey={type} htmlFor={`${type}-check-out`} hint={isLong ? '마지막 날' : '항상 다음 날'}>
                        <Input id={`${type}-check-out`} type="time" value={form.check_out_time} onChange={(event) => change({check_out_time: event.target.value})} />
                    </Field>
                    {isLong ? (
                        <>
                            <Field label="최소 박수" name="min_nights" dataKey={type} htmlFor={`${type}-min-nights`}>
                                <div className={styles.unit}><Input id={`${type}-min-nights`} type="number" min={1} max={180} value={form.min_nights} onChange={(event) => change({min_nights: event.target.value})} /><span>박</span></div>
                            </Field>
                            <Field label="최대 박수" name="max_nights" dataKey={type} htmlFor={`${type}-max-nights`}>
                                <div className={styles.unit}><Input id={`${type}-max-nights`} type="number" min={1} max={180} value={form.max_nights} onChange={(event) => change({max_nights: event.target.value})} /><span>박</span></div>
                            </Field>
                        </>
                    ) : null}
                </div>
            ) : null}

            {/* ② 연장 */}
            <hr className={styles.sep} />
            <div className={styles.kv}><Switch label="연장 가능" checked={form.is_extendable} onChange={(checked) => change({is_extendable: checked})} /></div>
            <Field label="최대 연장 횟수" name="max_extensions" dataKey={type} htmlFor={`${type}-max-extensions`} hint="연장 불가여도 값은 남습니다.">
                <div className={styles.unit}><Input id={`${type}-max-extensions`} type="number" min={1} max={10} value={form.max_extensions} onChange={(event) => change({max_extensions: event.target.value})} /><span>회 (1 ~ 10)</span></div>
            </Field>

            {/* ③④ 저장 */}
            <div className={styles.actions}>
                {saved ? <span className={styles.saved} role="status">저장했습니다.</span> : null}
                <Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : '저장'}</Button>
            </div>
        </Card>
    );
}
```

### 1-2. 객실 그룹 목록 — `RoomGroupListContent` · `RoomGroupForm`

그룹 등록 결과(`room_group_id`)가 오면 상세로, 늦어져 null 이면 목록을 다시 부른다(spec 결정). 검색은 제출한 검색어(`keyword`)가 바뀔 때만 부른다 — 칸을 고치는 동안은 부르지 않는다(대시보드와 같은 생각 — `ManagerDashboardContent.tsx` `query`).

```tsx
// src/app/manager/(console)/room-groups/RoomGroupListContent.tsx
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
 *
 * @returns
 */
export default function RoomGroupListContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                                       // 매니저 토큰
    const router = useRouter();                                                                                                                                 // 등록 뒤 상세로
    const loadPage = useEffectEvent((page: number, keyword: string, signal: AbortSignal) => getRoomGroups(auth, new RoomGroupListDto({page, size: PAGE_SIZE, keyword: keyword || null}), signal)); // 그때의 auth 로

    // 상태
    const [keywordInput, setKeywordInput] = useState<string>('');                         // ② 검색 칸
    const [keyword, setKeyword] = useState<string>('');                                   // ② 제출한 검색어
    const [page, setPage] = useState<number>(1);                                          // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                                // 다시 불러오기(등록이 늦어졌을 때)
    const [result, setResult] = useState<RoomGroupListResultDto | null>(null);            // ① 목록
    const [creating, setCreating] = useState<boolean>(false);                             // ③ 등록 대화상자
    const [form, setForm] = useState<RoomGroupFormType>(EMPTY_ROOM_GROUP_FORM);           // ③ 등록 칸
    const [busy, setBusy] = useState<boolean>(false);                                     // 등록 중

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
```

```tsx
// src/app/manager/(console)/room-groups/_components/RoomGroupForm.tsx
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import Textarea from '@/shared/components/ui/form/Textarea';
import { ROOM_GROUP_DETAIL_KEY, RoomGroupFormType } from '../room-group-format';
import styles from '@/app/css/manager/RoomGroupForm.module.css';

type RoomGroupFormProps = {
    idPrefix: string;                                       // 칸 id 앞(등록 대화상자 · 상세 카드)
    form: RoomGroupFormType;                                // 칸 값
    onChange: (patch: Partial<RoomGroupFormType>) => void;  // 칸 바꿈
};

/** 그룹명 최대 글자 수 — RoomGroupDto */
const NAME_MAX = 100;

/** 설명 최대 글자 수 — RoomGroupDto */
const DESCRIPTION_MAX = 2000;

/**
 * 객실 그룹 칸 — 그룹명 · 방 개수 · 설명 · 편의시설(샤워실 · TV · PC). 목록의 등록 대화상자와 상세의 기본 정보 카드가 함께 쓴다
 * - 방 개수는 안쪽 DTO(room_group_detail)라 오류 키를 붙인다
 *
 * @param param0
 * @returns
 */
export default function RoomGroupForm({idPrefix, form, onChange}: RoomGroupFormProps): React.ReactNode {
    return (
        // 그룹 칸
        <div className={styles.form}>
            {/* 그룹명 · 방 개수 */}
            <div className={styles.grid}>
                <Field label="그룹명" name="room_group_name" htmlFor={`${idPrefix}-name`} hint="업체 안에서 겹치지 않게, 100자 이내" required>
                    <Input id={`${idPrefix}-name`} maxLength={NAME_MAX} value={form.room_group_name} onChange={(event) => onChange({room_group_name: event.target.value})} />
                </Field>
                <Field label="방 개수" name="room_count" dataKey={ROOM_GROUP_DETAIL_KEY} htmlFor={`${idPrefix}-room-count`}>
                    <div className={styles.unit}><Input id={`${idPrefix}-room-count`} type="number" min={1} max={20} value={form.room_count} onChange={(event) => onChange({room_count: event.target.value})} /><span>개(원룸 1 · 투룸 2)</span></div>
                </Field>
            </div>

            {/* 설명 */}
            <Field label="설명" name="description" htmlFor={`${idPrefix}-description`} hint={`${form.description.length.toLocaleString('ko-KR')} / ${DESCRIPTION_MAX.toLocaleString('ko-KR')}`}>
                <Textarea id={`${idPrefix}-description`} rows={3} maxLength={DESCRIPTION_MAX} value={form.description} onChange={(event) => onChange({description: event.target.value})} />
            </Field>

            {/* 편의시설 */}
            <fieldset className={styles.amenities}>
                <legend className={styles.legend}>편의시설</legend>
                <Switch label="샤워실" checked={form.has_shower} onChange={(checked) => onChange({has_shower: checked})} />
                <Switch label="TV" checked={form.has_tv} onChange={(checked) => onChange({has_tv: checked})} />
                <Switch label="PC" checked={form.has_pc} onChange={(checked) => onChange({has_pc: checked})} />
            </fieldset>
        </div>
    );
}
```

### 1-3. 객실 그룹 상세 — `RoomGroupDetailContent` · `RoomGroupInfoCard` · `RoomGroupPhotos` · `RoomGroupPlans`

기본 정보 · 그룹 상품 칸은 그룹이 바뀔 때만(`key={room_group_id}`) 받은 값으로 채운다 — 사진을 올려 상세를 다시 불러와도 고치던 칸이 지워지지 않는다. 기간 가격 개수(`price_count`) · 머리 글자는 늘 받은 값.

```tsx
// src/app/manager/(console)/room-groups/[room_group_id]/RoomGroupDetailContent.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { deleteRoomGroup, getRoomGroup } from '@/contracts/room/api';
import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { handleApiError } from '@/shared/api/error';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { toKst } from '@/shared/utils/format';
import { PLAN_TYPE } from '../../plans/plan-format';
import { ROOM_GROUP_LIST_PATH, roomsText } from '../room-group-format';
import RoomGroupInfoCard from './_components/RoomGroupInfoCard';
import RoomGroupPhotos from './_components/RoomGroupPhotos';
import RoomGroupPlans from './_components/RoomGroupPlans';
import RoomGroupPrices from './_components/RoomGroupPrices';
import styles from '@/app/css/manager/RoomGroupDetailContent.module.css';

type RoomGroupDetailContentProps = {
    roomGroupId: string; // 주소의 그룹 ID
};

/**
 * M5 객실 그룹 상세 — 머리(호실 · 등록 · 수정) · 기본 정보 · 사진 · 그룹 상품 · 상품별 기간 가격 · 그룹 삭제
 *
 * @param param0
 * @returns
 */
export default function RoomGroupDetailContent({roomGroupId}: RoomGroupDetailContentProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                    // 매니저 토큰
    const router = useRouter();                                                                              // 삭제 뒤 목록으로
    const loadGroup = useEffectEvent((signal: AbortSignal) => getRoomGroup(auth, roomGroupId, signal));      // 그때의 auth · 그룹으로

    // 상태
    const [reloadKey, setReloadKey] = useState<number>(0);                       // ⑤ 다시 불러오기
    const [group, setGroup] = useState<RoomGroupDetailResultDto | null>(null);   // ① 그룹 상세
    const [failed, setFailed] = useState<boolean>(false);                        // ① 못 읽음
    const [priceType, setPriceType] = useState<string>(PLAN_TYPE.HOURLY);        // 기간 가격 절의 상품 — 화면 상태
    const [deleting, setDeleting] = useState<boolean>(false);                    // ⑥ 삭제 확인 창
    const [busy, setBusy] = useState<boolean>(false);                            // ⑥ 삭제 중

    // 효과
    useEffect(() => {
        // ① 그룹 상세(그룹이 바뀌거나 다시 부를 때 · 떠나면 결과를 버린다)
        const controller = new AbortController();
        loadGroup(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setGroup(next);
                setFailed(next === null);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                setFailed(true);
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, [roomGroupId, reloadKey]);

    // 함수
    function reloadGroup(): void {
        // ⑤ 다시 불러오기
        setReloadKey((key) => key + 1);
    }

    async function confirmDelete(): Promise<void> {
        // ⑥ 확인 뒤 삭제(큐) → 목록으로
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteRoomGroup(auth, roomGroupId);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(false);
        if (failure) {
            handleApiError(failure.error); // 예약이 있으면 받은 문구
            return;
        }

        router.push(ROOM_GROUP_LIST_PATH);
    }

    if (!group) {
        return failed ? (
            // ① 못 읽음
            <EmptyState title="객실 그룹을 불러오지 못했어요" description="지워졌거나 잠시 연결이 안 됩니다." action={<Link href={ROOM_GROUP_LIST_PATH} className={buttonClass({size: 'sm'})}>목록으로</Link>} />
        ) : null;
    }

    return (
        // 객실 그룹 상세
        <div className={styles.page}>
            {/* ① 머리 */}
            <div className={styles.head}>
                <div>
                    <p className={styles.crumb}><Link href={ROOM_GROUP_LIST_PATH}>객실 그룹</Link> › {group.room_group_name}</p>
                    <h1 className={styles.title}>{group.room_group_name}</h1>
                    <p className={styles.subtitle}>{roomsText(group)} · 등록 {toKst(group.created_at, 'YYYY-MM-DD')} · 수정 {toKst(group.updated_at, 'YYYY-MM-DD HH:mm')}</p>
                </div>
                <Button variant="danger" onClick={() => setDeleting(true)}>그룹 삭제</Button>
            </div>

            {/* ② 기본 정보 · ③ 사진 */}
            <div className={styles.cols}>
                <RoomGroupInfoCard key={group.room_group_id} group={group} onSaved={reloadGroup} />
                <RoomGroupPhotos group={group} onSaved={reloadGroup} />
            </div>

            {/* ④ 그룹 상품 */}
            <RoomGroupPlans key={group.room_group_id} group={group} onSaved={reloadGroup} onShowPrices={setPriceType} />

            {/* 상품별 기간 가격 — 상품이 바뀌면 1쪽부터 */}
            <RoomGroupPrices key={`${group.room_group_id}-${priceType}`} roomGroupId={group.room_group_id} plans={group.plans} type={priceType} onTypeChange={setPriceType} onChanged={reloadGroup} />

            {/* ⑥ 삭제 확인 */}
            <ConfirmModal open={deleting} title="그룹 삭제" message={`${group.room_group_name} 그룹을 삭제할까요? 그룹의 호실 · 사진도 함께 지워집니다.`} confirmLabel="삭제" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(false)} />
        </div>
    );
}
```

```tsx
// src/app/manager/(console)/room-groups/[room_group_id]/_components/RoomGroupInfoCard.tsx
'use client';
import { useContext, useState } from 'react';
import { updateRoomGroup } from '@/contracts/room/api';
import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import RoomGroupForm from '../../_components/RoomGroupForm';
import { roomGroupFormOf, RoomGroupFormType, toRoomGroupUpdateDto, validateRoomGroup } from '../../room-group-format';
import styles from '@/app/css/manager/RoomGroupForm.module.css';

type RoomGroupInfoCardProps = {
    group: RoomGroupDetailResultDto; // 그룹 상세 — 칸을 한 번 채운다
    onSaved: () => void;             // 저장 뒤 상세 다시
};

/**
 * 기본 정보 카드 — 그룹명 · 방 개수 · 설명 · 편의시설 저장
 *
 * @param param0
 * @returns
 */
export default function RoomGroupInfoCard({group, onSaved}: RoomGroupInfoCardProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [form, setForm] = useState<RoomGroupFormType>(() => roomGroupFormOf(group)); // 칸 값
    const [saving, setSaving] = useState<boolean>(false);                              // 저장 중

    // 함수
    async function save(): Promise<void> {
        // ② 그룹명 · 설명 · 방 개수 검사 → 수정(큐 — 편의시설 통째로) → ⑤ 상세 다시
        const dto = toRoomGroupUpdateDto(form);
        if (saving || !(await validateRoomGroup(dto))) {
            return;
        }

        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateRoomGroup(auth, group.room_group_id, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error); // 그룹명이 겹치면 그룹명 칸 옆
            return;
        }

        onSaved();
    }

    return (
        // 기본 정보
        <Card title="기본 정보">
            <RoomGroupForm idPrefix="group-info" form={form} onChange={(patch) => setForm((prev) => ({...prev, ...patch}))} />
            <div className={styles.actions}><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : '기본 정보 저장'}</Button></div>
        </Card>
    );
}
```

`RoomGroupPhotos` 는 내 업체 사진 탭(`src/app/manager/(console)/store/_components/StorePhotosTab.tsx:31-123`)의 업체 사진 카드와 같은 흐름 — 다른 점만 코드로 둔다(사진 목록 · API 4개 · 카드 제목).

```tsx
// src/app/manager/(console)/room-groups/[room_group_id]/_components/RoomGroupPhotos.tsx — StorePhotosTab 과 다른 줄
const images: Array<UploaderImageType> = [...group.images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({id: image.room_group_image_id, image_url: image.image_url, alt: image.file_name})); // ③ 그룹 사진 — 순서대로

const steps: UploadStepsType<RoomGroupImageResultDto> = {
    issue: (content_type) => issueRoomGroupImageUrl(auth, group.room_group_id, Object.assign(new RoomGroupImageUploadUrlDto(), {content_type})),
    register: (uploaded) => registerRoomGroupImage(auth, group.room_group_id, Object.assign(new RoomGroupImageDto(), uploaded)),
};
// 순서 — await reorderRoomGroupImages(auth, group.room_group_id, Object.assign(new RoomGroupImageOrderDto(), {room_group_image_ids: ids}));
// 삭제 — await deleteRoomGroupImage(auth, group.room_group_id, target);

<Card title={`사진 ${images.length} / ${ROOM_GROUP_IMAGE_MAX}`}>
    <p className={styles.hint}>끌어서 순서를 바꾸면 그 순서로 저장합니다. 첫 번째가 대표 사진.</p>
    <ImageUploader images={images} max={ROOM_GROUP_IMAGE_MAX} onUpload={upload} onDelete={setDeleting} onReorder={reorder} disabled={busy} />
</Card>
// 사업자등록증 카드는 없다. 삭제 확인 창은 같은 문구("이 사진을 지울까요?")
```

```tsx
// src/app/manager/(console)/room-groups/[room_group_id]/_components/RoomGroupPlans.tsx
'use client';
import Link from 'next/link';
import { useContext, useState } from 'react';
import { updateRoomGroupPlan } from '@/contracts/room/api';
import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { RoomGroupPlanUpdateDto } from '@/contracts/room/dto/room-group-plan-update.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Band from '@/shared/components/ui/display/Band';
import Card from '@/shared/components/ui/display/Card';
import Table from '@/shared/components/ui/display/Table';
import FieldError from '@/shared/components/ui/form/FieldError';
import Input from '@/shared/components/ui/form/Input';
import Switch from '@/shared/components/ui/form/Switch';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { numberOf } from '@/shared/utils/util';
import { resetValidationError, validateActionChildren } from '@/shared/utils/validation';
import { PLAN_TYPE, PLANS_PATH } from '../../../plans/plan-format';
import styles from '@/app/css/manager/RoomGroupPlans.module.css';

type RoomGroupPlansProps = {
    group: RoomGroupDetailResultDto;        // 그룹 상세 — plans(판매 · 요금 · 기간 가격 개수)
    onSaved: () => void;                    // 저장 뒤 상세 다시
    onShowPrices: (type: string) => void;   // 기간 가격 개수 — 아래 절을 그 상품으로
};

/** 그룹 상품 한 줄 칸 */
type PlanRowType = {
    is_used: boolean; // 판매
    price: string;    // 기본 요금 칸 글자
};

/**
 * 그룹 상품 카드 — 상품마다 판매 · 기본 요금 · 기간 가격 개수 · 줄 저장
 * - 줄 3개가 같은 칸 이름(price)이라 오류는 상품 종류 키로 그 줄에 붙인다
 *
 * @param param0
 * @returns
 */
export default function RoomGroupPlans({group, onSaved, onShowPrices}: RoomGroupPlansProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [rows, setRows] = useState<Record<string, PlanRowType>>(() => Object.fromEntries(group.plans.map((plan) => [plan.room_plan_type_id, {is_used: plan.is_used === 1, price: String(plan.price)}]))); // ④ 줄 칸 — 받은 값으로 한 번
    const [saving, setSaving] = useState<string | null>(null);                                                                                                                                              // 저장 중인 상품

    // 함수
    function change(type: string, patch: Partial<PlanRowType>): void {
        // 그 줄 칸 바꿈
        setRows((prev) => ({...prev, [type]: {...prev[type], ...patch}}));
    }

    async function save(type: string): Promise<void> {
        // ④ 그 줄 검사(상품 종류 키) → 그룹 상품 수정(큐) → ⑤ 상세 다시
        const row = rows[type];
        if (saving !== null || !row) {
            return;
        }

        const dto = Object.assign(new RoomGroupPlanUpdateDto(), {is_used: row.is_used ? 1 : 0, price: numberOf(row.price)});
        resetValidationError();
        if (!(await validateActionChildren(dto, type))) {
            return;
        }

        setSaving(type);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateRoomGroupPlan(auth, group.room_group_id, type, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(null);
        if (failure) {
            handleApiError(failure.error, true, type); // 판매인데 요금 0 — 그 줄 요금 칸 옆
            return;
        }

        onSaved();
    }

    return (
        // 그룹 상품
        <Card title="그룹 상품" actions={<Link href={PLANS_PATH} className={styles.link}>업체 상품 설정으로</Link>}>
            <Band tone="info">업체 상품 설정에서 판매하지 않는 상품은 그룹 상품을 켜도 팔리지 않습니다. 기본 요금은 시간 이용 1회 · 1박 · 연박 1박당입니다.</Band>
            <Table>
                <thead><tr><th scope="col">상품</th><th scope="col">판매</th><th scope="col">기본 요금</th><th scope="col">기간 가격</th><th scope="col"><span className={styles.srOnly}>저장</span></th></tr></thead>
                <tbody>
                    {group.plans.map((plan) => {
                        const type = plan.room_plan_type_id;
                        const row = rows[type];
                        return row ? (
                            <tr key={type}>
                                <th scope="row">{plan.room_plan_type_name}</th>
                                <td><Switch label={`${plan.room_plan_type_name} 판매`} checked={row.is_used} onChange={(checked) => change(type, {is_used: checked})} /></td>
                                <td>
                                    <div className={styles.unit}><Input type="number" min={0} aria-label={`${plan.room_plan_type_name} 기본 요금`} value={row.price} onChange={(event) => change(type, {price: event.target.value})} /><span>{type === PLAN_TYPE.LONG ? '원 / 1박' : '원'}</span></div>
                                    <FieldError name="price" dataKey={type} />
                                </td>
                                <td><Button size="sm" onClick={() => onShowPrices(type)}>{plan.price_count}개</Button></td>
                                <td><Button size="sm" variant="primary" disabled={saving !== null} onClick={() => save(type)}>{saving === type ? '처리 중…' : '저장'}</Button></td>
                            </tr>
                        ) : null;
                    })}
                </tbody>
            </Table>
        </Card>
    );
}
```

### 1-4. 상품별 기간 가격 — `RoomGroupPrices`

상품은 부모가 정하고(`key` 에 상품 — 바꾸면 1쪽부터 새로 그린다), 이 부품은 그 상품의 목록 · 대화상자 · 삭제만 한다. 추가 · 수정 · 삭제 뒤 부모의 `onChanged` 로 상세(기간 가격 개수)도 다시 부른다.

```tsx
// src/app/manager/(console)/room-groups/[room_group_id]/_components/RoomGroupPrices.tsx
'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { createRoomGroupPlanPrice, deleteRoomGroupPlanPrice, getRoomGroupPlanPrices, updateRoomGroupPlanPrice } from '@/contracts/room/api';
import { RoomGroupDetailPlanResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { RoomGroupPlanPriceItemResultDto, RoomGroupPlanPriceListDto, RoomGroupPlanPriceListResultDto } from '@/contracts/room/dto/room-group-plan-price-list.dto';
import { RoomGroupPlanPriceUpdateDto } from '@/contracts/room/dto/room-group-plan-price-update.dto';
import { RoomGroupPlanPriceDto } from '@/contracts/room/dto/room-group-plan-price.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Segmented from '@/shared/components/ui/form/Segmented';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import Modal from '@/shared/components/ui/modal/Modal';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { formatPrice } from '@/shared/utils/format';
import { numberOf } from '@/shared/utils/util';
import { resetValidationError, validateActionChildren } from '@/shared/utils/validation';
import styles from '@/app/css/manager/RoomGroupPrices.module.css';

type RoomGroupPricesProps = {
    roomGroupId: string;                          // 그룹 ID
    plans: Array<RoomGroupDetailPlanResultDto>;   // 그룹 상품 — 상품 이름 · 기본 요금
    type: string;                                 // 고른 상품
    onTypeChange: (type: string) => void;         // ① 상품 고르기
    onChanged: () => void;                        // ⑤ 상세 다시(기간 가격 개수)
};

/** 기간 가격 대화상자 칸 */
type PriceFormType = {
    start_date: string; // 시작 날짜(YYYY-MM-DD)
    end_date: string;   // 종료 날짜
    price: string;      // 요금 칸 글자
    memo: string;       // 메모
};

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/** 메모 최대 글자 수 — RoomGroupPlanPriceDto */
const MEMO_MAX = 30;

/** 대화상자 칸 오류 키 — 그룹 상품 줄의 price 와 나눈다 */
const PRICE_FORM_KEY = 'plan_price';

/** 빈 대화상자 칸 */
const EMPTY_PRICE_FORM: PriceFormType = {start_date: '', end_date: '', price: '', memo: ''};

/**
 * 상품별 기간 가격 — 상품 고르기 · 목록(시작 날짜 순) · 추가 / 수정 대화상자 · 삭제
 *
 * @param param0
 * @returns
 */
export default function RoomGroupPrices({roomGroupId, plans, type, onTypeChange, onChanged}: RoomGroupPricesProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                                                                  // 매니저 토큰
    const loadPage = useEffectEvent((page: number, signal: AbortSignal) => getRoomGroupPlanPrices(auth, roomGroupId, type, new RoomGroupPlanPriceListDto({page, size: PAGE_SIZE}), signal)); // 그때의 auth · 상품으로

    // 상태
    const [page, setPage] = useState<number>(1);                                                        // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                                              // ⑤ 목록 다시
    const [result, setResult] = useState<RoomGroupPlanPriceListResultDto | null>(null);                 // ① 목록
    const [editing, setEditing] = useState<RoomGroupPlanPriceItemResultDto | 'new' | null>(null);       // ② 대화상자 — 추가 · 고칠 줄 · 닫힘
    const [form, setForm] = useState<PriceFormType>(EMPTY_PRICE_FORM);                                 // ② 대화상자 칸
    const [busy, setBusy] = useState<boolean>(false);                                                   // 저장 · 삭제 중
    const [deleting, setDeleting] = useState<string | null>(null);                                      // ④ 지울 기간 가격 ID — 확인 창

    // 계산 값
    const plan = plans.find((item) => item.room_plan_type_id === type) ?? null;                         // 고른 상품 — 이름 · 기본 요금
    const planName = plan?.room_plan_type_name ?? '';                                                   // 상품 이름
    const options = plans.map((item) => ({value: item.room_plan_type_id, label: item.room_plan_type_name})); // ① 상품 고르기
    const isEdit = editing !== null && editing !== 'new';                                               // 수정 대화상자

    // 효과
    useEffect(() => {
        // ① 그 상품 · 그 쪽 목록(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadPage(page, controller.signal).then((next) => {
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
    }, [page, reloadKey]);

    // 함수
    function openCreate(): void {
        // ② 빈 칸으로 추가
        setForm(EMPTY_PRICE_FORM);
        setEditing('new');
    }

    function openEdit(item: RoomGroupPlanPriceItemResultDto): void {
        // ② 그 줄 값으로 수정
        setForm({start_date: item.start_date, end_date: item.end_date, price: String(item.price), memo: item.memo ?? ''});
        setEditing(item);
    }

    function changed(): void {
        // ⑤ 목록 · 상세 다시
        setReloadKey((key) => key + 1);
        onChanged();
    }

    async function save(): Promise<void> {
        // ③ 검사(대화상자 키) → 등록 · 수정(큐 — 통째로) → ⑤ 닫고 목록 · 상세 다시
        const target = editing;
        if (busy || target === null) {
            return;
        }

        const body = {start_date: form.start_date, end_date: form.end_date, price: numberOf(form.price), memo: form.memo.trim()};
        const dto = target === 'new' ? Object.assign(new RoomGroupPlanPriceDto(), body) : Object.assign(new RoomGroupPlanPriceUpdateDto(), body);
        resetValidationError();
        if (!(await validateActionChildren(dto, PRICE_FORM_KEY))) {
            return;
        }

        const send = target === 'new'
            ? () => createRoomGroupPlanPrice(auth, roomGroupId, type, dto)
            : () => updateRoomGroupPlanPrice(auth, roomGroupId, type, target.room_group_plan_price_id, dto); // try 안에 갈래를 두지 않는다
        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await send();
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        if (failure) {
            handleApiError(failure.error, true, PRICE_FORM_KEY); // 날짜 겹침 · 종료가 빠름 — 대화상자 칸 옆
            return;
        }

        setEditing(null);
        changed();
    }

    async function confirmDelete(): Promise<void> {
        // ④ 확인 뒤 삭제(큐) → ⑤ 목록 · 상세 다시
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteRoomGroupPlanPrice(auth, roomGroupId, type, target);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(null);
        if (failure) {
            handleApiError(failure.error);
        }
        changed();
    }

    return (
        // 상품별 기간 가격
        <Card title="상품별 기간 가격" actions={<Button size="sm" variant="primary" onClick={openCreate}>기간 가격 추가</Button>}>
            {/* ① 상품 고르기 */}
            <Segmented label="상품" options={options} value={type} onChange={onTypeChange} />

            {/* ① 목록 */}
            {result && result.list.length === 0 ? <EmptyState title="기간 가격이 없습니다." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">기간</th><th scope="col">요금</th><th scope="col">메모</th><th scope="col"><span className={styles.srOnly}>작업</span></th></tr></thead>
                    <tbody>
                        {result.list.map((item) => (
                            <tr key={item.room_group_plan_price_id}>
                                <td className={styles.number}>{item.start_date} ~ {item.end_date}</td>
                                <td className={styles.number}>{formatPrice(item.price)}</td>
                                <td>{item.memo ?? '-'}</td>
                                <td><div className={styles.acts}><Button size="sm" onClick={() => openEdit(item)}>수정</Button><Button size="sm" variant="danger" disabled={busy} onClick={() => setDeleting(item.room_group_plan_price_id)}>삭제</Button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="기간 가격 페이지" />
            {plan ? <p className={styles.hint}>시작 · 종료 날짜 모두 포함. 이 기간에는 기본 요금({planName} {formatPrice(plan.price)}) 대신 이 요금으로 팝니다.</p> : null}

            {/* ②③ 추가 · 수정 */}
            <Modal open={editing !== null} title={`기간 가격 ${isEdit ? '수정' : '추가'} — ${planName}`} onClose={() => setEditing(null)} footer={<><Button onClick={() => setEditing(null)}>취소</Button><Button variant="primary" disabled={busy} onClick={save}>{busy ? '처리 중…' : isEdit ? '저장' : '추가'}</Button></>}>
                <div className={styles.dates}>
                    <Field label="시작 날짜" name="start_date" dataKey={PRICE_FORM_KEY} htmlFor="price-start"><Input id="price-start" type="date" value={form.start_date} onChange={(event) => setForm((prev) => ({...prev, start_date: event.target.value}))} /></Field>
                    <Field label="종료 날짜" name="end_date" dataKey={PRICE_FORM_KEY} htmlFor="price-end"><Input id="price-end" type="date" value={form.end_date} onChange={(event) => setForm((prev) => ({...prev, end_date: event.target.value}))} /></Field>
                </div>
                <Field label="요금" name="price" dataKey={PRICE_FORM_KEY} htmlFor="price-price" hint="1 ~ 10,000,000원">
                    <div className={styles.unit}><Input id="price-price" type="number" min={1} value={form.price} onChange={(event) => setForm((prev) => ({...prev, price: event.target.value}))} /><span>원</span></div>
                </Field>
                <Field label="메모(선택)" name="memo" dataKey={PRICE_FORM_KEY} htmlFor="price-memo" hint={`${form.memo.length} / ${MEMO_MAX}`}>
                    <Input id="price-memo" maxLength={MEMO_MAX} value={form.memo} onChange={(event) => setForm((prev) => ({...prev, memo: event.target.value}))} />
                </Field>
                <p className={styles.hint}>시작 · 종료 날짜 모두 포함, 종료 날짜는 시작과 같거나 늦어야 합니다.</p>
            </Modal>

            {/* ④ 삭제 확인 */}
            <ConfirmModal open={deleting !== null} title="기간 가격 지우기" message="이 기간 가격을 지울까요? 그 기간에는 기본 요금으로 팝니다." confirmLabel="지우기" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </Card>
    );
}
```

### 1-5. 호실 — `RoomsContent` · `RoomFormModal` · `RoomStateModal`

거르기는 화면 상태 — 바꾸면 1쪽부터. 층 선택지는 응답의 `floors`(거르기 · 쪽과 상관없이 늘 전부 — 변경 문서). 거르기 칸은 검사 칸이 아니라 `Field` 없이 그린다(대화상자의 `room_group_id` · `floor` 오류 칸과 겹치지 않게). 문 열기는 목록을 다시 부르지 않고 그 줄만 받은 시각으로 바꾼다.

```tsx
// src/app/manager/(console)/rooms/RoomsContent.tsx
'use client';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { deleteRoom, getRoomGroups, getRooms, openRoomDoor } from '@/contracts/room/api';
import { RoomDoorOpenResultDto } from '@/contracts/room/dto/room-door-open.dto';
import { RoomGroupListDto, RoomGroupListItemResultDto } from '@/contracts/room/dto/room-group-list.dto';
import { RoomListDto, RoomListItemResultDto, RoomListResultDto } from '@/contracts/room/dto/room-list.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Table from '@/shared/components/ui/display/Table';
import Select from '@/shared/components/ui/form/Select';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import Pagination from '@/shared/components/ui/nav/Pagination';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import RoomFormModal from './_components/RoomFormModal';
import RoomStateModal from './_components/RoomStateModal';
import { floorLabel, formatOpenedAt, ROOM_STATE_TONE } from './room-format';
import styles from '@/app/css/manager/RoomsContent.module.css';

/** 한 쪽 개수 */
const PAGE_SIZE = 20;

/**
 * M4 호실 — 층 · 그룹 거르기 · 호실 표 · 등록 / 수정 대화상자 · 상태 대화상자 · 문 바로 열기 · 삭제
 *
 * @returns
 */
export default function RoomsContent(): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext);                                                                                                      // 매니저 토큰
    const loadRooms = useEffectEvent((query: RoomListDto, signal: AbortSignal) => getRooms(auth, query, signal));                              // 그때의 auth 로
    const loadGroups = useEffectEvent((signal: AbortSignal) => getRoomGroups(auth, new RoomGroupListDto({all_search_yn: 'Y'}), signal));      // 그룹 전체

    // 상태
    const [floor, setFloor] = useState<string>('');                                          // ① 층 거르기 — '' 전체
    const [groupId, setGroupId] = useState<string>('');                                      // ① 그룹 거르기 — '' 전체
    const [page, setPage] = useState<number>(1);                                             // 보는 쪽
    const [reloadKey, setReloadKey] = useState<number>(0);                                   // ⑥ 지금 쪽 다시
    const [result, setResult] = useState<RoomListResultDto | null>(null);                    // ① 목록 · 층 선택지
    const [groups, setGroups] = useState<Array<RoomGroupListItemResultDto>>([]);             // ① 그룹 전체 — 거르기 · 등록 고르기
    const [editing, setEditing] = useState<RoomListItemResultDto | 'new' | null>(null);      // ③ 등록 · 고칠 호실 · 닫힘
    const [stateTarget, setStateTarget] = useState<RoomListItemResultDto | null>(null);      // ④ 상태 대화상자
    const [deleting, setDeleting] = useState<RoomListItemResultDto | null>(null);            // ⑥ 삭제 확인 창
    const [busy, setBusy] = useState<boolean>(false);                                        // ⑥ 삭제 중
    const [opening, setOpening] = useState<string | null>(null);                             // ⑤ 문을 여는 호실 ID

    // 계산 값
    const floors = result?.floors ?? []; // ① 층 선택지 — 늘 전부

    // 효과
    useEffect(() => {
        // ① 그 쪽 · 거르기 호실(떠나면 결과를 버린다)
        const controller = new AbortController();
        loadRooms(new RoomListDto({page, size: PAGE_SIZE, floor: floor || null, room_group_id: groupId || null}), controller.signal).then((next) => {
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
    }, [page, floor, groupId, reloadKey]);

    useEffect(() => {
        // ① 그룹 전체 — 한 번
        const controller = new AbortController();
        loadGroups(controller.signal).then((next) => {
            if (!controller.signal.aborted) {
                setGroups(next?.list ?? []);
            }
        }).catch((error: unknown) => {
            if (!controller.signal.aborted) {
                handleApiError(error);
            }
        });

        return () => {
            controller.abort();
        };
    }, []);

    // 함수
    function changeFloor(value: string): void {
        // ① 층 거르기 → 1쪽
        setFloor(value);
        setPage(1);
    }

    function changeGroup(value: string): void {
        // ① 그룹 거르기 → 1쪽
        setGroupId(value);
        setPage(1);
    }

    function resetFilter(): void {
        // ① 초기화
        setFloor('');
        setGroupId('');
        setPage(1);
    }

    function onSaved(): void {
        // ③④⑥ 끝나면 대화상자를 닫고 지금 쪽 다시
        setEditing(null);
        setStateTarget(null);
        setReloadKey((key) => key + 1);
    }

    async function openDoor(room: RoomListItemResultDto): Promise<void> {
        // ⑤ 문 바로 열기(동기) → 그 줄의 마지막으로 연 시각만 바꾼다
        if (opening !== null) {
            return;
        }

        setOpening(room.room_id);
        let opened: RoomDoorOpenResultDto | null = null; // 받은 시각
        let failure: {error: unknown} | null = null;     // 실패 — 처리는 try 밖에서
        try {
            opened = await openRoomDoor(auth, room.room_id);
        } catch (error) {
            failure = {error};
        }

        setOpening(null);
        if (failure) {
            handleApiError(failure.error); // 503 — 받은 문구
            return;
        }

        if (opened) {
            const openedAt = opened.door_opened_at;
            setResult((prev) => (prev ? {...prev, list: prev.list.map((item) => (item.room_id === room.room_id ? {...item, door_opened_at: openedAt} : item))} : prev));
        }
    }

    async function confirmDelete(): Promise<void> {
        // ⑥ 확인 뒤 삭제(큐) → 지금 쪽 다시
        const target = deleting;
        if (!target) {
            return;
        }

        setBusy(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await deleteRoom(auth, target.room_id);
        } catch (error) {
            failure = {error};
        }

        setBusy(false);
        setDeleting(null);
        if (failure) {
            handleApiError(failure.error); // 예약이 있으면 받은 문구
            return;
        }
        onSaved();
    }

    return (
        // 호실
        <div className={styles.page}>
            {/* 머리 */}
            <div className={styles.head}>
                <div>
                    <h1 className={styles.title}>호실</h1>
                    <p className={styles.subtitle}>호실마다 상태와 문을 관리합니다. 그룹은 등록 때만 정합니다.</p>
                </div>
                <Button variant="primary" onClick={() => setEditing('new')}>호실 등록</Button>
            </div>

            {/* ① 거르기 */}
            <div className={styles.filters}>
                <div className={styles.floorFilter}>
                    <label className={styles.label} htmlFor="rooms-floor">층</label>
                    <Select id="rooms-floor" value={floor} onChange={(event) => changeFloor(event.target.value)}>
                        <option value="">전체</option>
                        {floors.map((item) => <option key={item} value={String(item)}>{floorLabel(item)}</option>)}
                    </Select>
                </div>
                <div className={styles.groupFilter}>
                    <label className={styles.label} htmlFor="rooms-group">객실 그룹</label>
                    <Select id="rooms-group" value={groupId} onChange={(event) => changeGroup(event.target.value)}>
                        <option value="">전체</option>
                        {groups.map((group) => <option key={group.room_group_id} value={group.room_group_id}>{group.room_group_name}</option>)}
                    </Select>
                </div>
                <Button onClick={resetFilter}>초기화</Button>
            </div>

            {/* ② 안내 띠 */}
            <Band tone="info">사용중지로 바꾸면 그 호실 예약자는 예약 끝 전까지 전액 환불 취소를 할 수 있습니다. 앞으로의 예약이 있는 호실은 삭제할 수 없습니다. 문 열기는 문 쪽 프로그램이 연결돼 있어야 합니다.</Band>

            {/* ② 표 */}
            {result && result.list.length === 0 ? <EmptyState title="호실이 없습니다." /> : null}
            {result && result.list.length > 0 ? (
                <Table>
                    <thead><tr><th scope="col">호실</th><th scope="col">층</th><th scope="col">객실 그룹</th><th scope="col">호실 상태</th><th scope="col">마지막으로 연 시각</th><th scope="col">작업</th></tr></thead>
                    <tbody>
                        {result.list.map((room) => (
                            <tr key={room.room_id}>
                                <td><b>{room.room_name}</b></td>
                                <td>{floorLabel(room.floor)}</td>
                                <td>{room.room_group_name}</td>
                                <td><Badge tone={ROOM_STATE_TONE[room.room_state_id] ?? 'neutral'}>{room.room_state_name}</Badge></td>
                                <td className={styles.number}>{formatOpenedAt(room.door_opened_at)}</td>
                                <td>
                                    <div className={styles.acts}>
                                        <Button size="sm" onClick={() => setEditing(room)}>수정</Button>
                                        <Button size="sm" onClick={() => setStateTarget(room)}>상태</Button>
                                        <Button size="sm" disabled={opening !== null} onClick={() => openDoor(room)}>{opening === room.room_id ? '여는 중…' : '문 열기'}</Button>
                                        <Button size="sm" variant="danger" onClick={() => setDeleting(room)}>삭제</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : null}
            <Pagination pagination={result?.pagination ?? null} movePage={(next) => setPage(Number(next))} label="호실 페이지" />

            {/* ③ 등록 · 수정 — 열 때마다 새 칸 */}
            {editing !== null ? <RoomFormModal key={editing === 'new' ? 'new' : editing.room_id} room={editing === 'new' ? null : editing} groups={groups} onClose={() => setEditing(null)} onSaved={onSaved} /> : null}

            {/* ④ 상태 */}
            {stateTarget ? <RoomStateModal key={stateTarget.room_id} room={stateTarget} onClose={() => setStateTarget(null)} onSaved={onSaved} /> : null}

            {/* ⑥ 삭제 확인 */}
            <ConfirmModal open={deleting !== null} title="호실 삭제" message={`${deleting?.room_name ?? ''}을 삭제할까요?`} confirmLabel="삭제" danger busy={busy} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />
        </div>
    );
}
```

```tsx
// src/app/manager/(console)/rooms/_components/RoomFormModal.tsx
'use client';
import { useContext, useState } from 'react';
import { createRoom, updateRoom } from '@/contracts/room/api';
import { RoomGroupListItemResultDto } from '@/contracts/room/dto/room-group-list.dto';
import { RoomListItemResultDto } from '@/contracts/room/dto/room-list.dto';
import { RoomUpdateDto } from '@/contracts/room/dto/room-update.dto';
import { RoomDto } from '@/contracts/room/dto/room.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import Select from '@/shared/components/ui/form/Select';
import Modal from '@/shared/components/ui/modal/Modal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { numberOf } from '@/shared/utils/util';
import { validateAction } from '@/shared/utils/validation';
import styles from '@/app/css/manager/RoomsContent.module.css';

type RoomFormModalProps = {
    room: RoomListItemResultDto | null;           // 고칠 호실 — null 이면 등록
    groups: Array<RoomGroupListItemResultDto>;    // 등록 때 고를 그룹 전체
    onClose: () => void;                          // 닫기
    onSaved: () => void;                          // 저장 뒤 — 닫고 목록 다시
};

/** 호실명 최대 글자 수 — RoomDto */
const ROOM_NAME_MAX = 50;

/**
 * 호실 등록 · 수정 대화상자 — 등록은 그룹 고르기 · 호실명 · 층, 수정은 그룹을 읽기만
 *
 * @param param0
 * @returns
 */
export default function RoomFormModal({room, groups, onClose, onSaved}: RoomFormModalProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [groupId, setGroupId] = useState<string>(room?.room_group_id ?? '');          // 그룹(등록만)
    const [name, setName] = useState<string>(room?.room_name ?? '');                   // 호실명
    const [floor, setFloor] = useState<string>(room ? String(room.floor) : '');        // 층 칸 글자
    const [saving, setSaving] = useState<boolean>(false);                              // 저장 중

    // 함수
    async function save(): Promise<void> {
        // ③ 검사 → 등록 · 수정(큐) → ⑥ 닫고 목록 다시
        const target = room;
        if (saving) {
            return;
        }

        const values = {room_name: name.trim(), floor: numberOf(floor)};
        const createDto = Object.assign(new RoomDto(), {room_group_id: groupId}, values);
        const updateDto = Object.assign(new RoomUpdateDto(), values);
        if (!(await validateAction(target === null ? createDto : updateDto))) {
            return;
        }

        const send = target === null ? () => createRoom(auth, createDto) : () => updateRoom(auth, target.room_id, updateDto); // try 안에 갈래를 두지 않는다
        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await send();
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error); // 호실명이 겹치면 호실명 칸 옆
            return;
        }

        onSaved();
    }

    return (
        // 호실 등록 · 수정
        <Modal open title={room ? `호실 수정 — ${room.room_name}` : '호실 등록'} onClose={onClose} footer={<><Button onClick={onClose}>취소</Button><Button variant="primary" disabled={saving} onClick={save}>{saving ? '처리 중…' : room ? '저장' : '등록'}</Button></>}>
            {/* 그룹 — 등록은 고르기, 수정은 읽기만 */}
            {room ? (
                <Field label="객실 그룹" name="room_group_id" htmlFor="room-form-group" hint="그룹은 바꾸지 않습니다. 잘못 등록했으면 지우고 다시 등록합니다.">
                    <Input id="room-form-group" readOnly value={room.room_group_name} />
                </Field>
            ) : (
                <Field label="객실 그룹" name="room_group_id" htmlFor="room-form-group" hint="그룹은 등록 뒤 바꿀 수 없습니다." required>
                    <Select id="room-form-group" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                        <option value="">그룹을 고르세요</option>
                        {groups.map((group) => <option key={group.room_group_id} value={group.room_group_id}>{group.room_group_name}</option>)}
                    </Select>
                </Field>
            )}

            {/* 호실명 · 층 */}
            <Field label="호실명" name="room_name" htmlFor="room-form-name" required>
                <Input id="room-form-name" maxLength={ROOM_NAME_MAX} value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="층" name="floor" htmlFor="room-form-floor" hint="-10 ~ 200, 지하는 음수(B1 = -1)" required>
                <div className={styles.unit}><Input id="room-form-floor" type="number" min={-10} max={200} value={floor} onChange={(event) => setFloor(event.target.value)} /><span>층</span></div>
            </Field>
        </Modal>
    );
}
```

```tsx
// src/app/manager/(console)/rooms/_components/RoomStateModal.tsx
'use client';
import { useContext, useState } from 'react';
import { updateRoomState } from '@/contracts/room/api';
import { RoomListItemResultDto } from '@/contracts/room/dto/room-list.dto';
import { RoomStateDto } from '@/contracts/room/dto/room-state.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Modal from '@/shared/components/ui/modal/Modal';
import { AuthContext } from '@/shared/providers/RootLayoutProvider';
import { ROOM_STATE, roomStateActions } from '../room-format';
import styles from '@/app/css/manager/RoomsContent.module.css';

type RoomStateModalProps = {
    room: RoomListItemResultDto; // 바꿀 호실
    onClose: () => void;         // 닫기
    onSaved: () => void;         // 바꾼 뒤 — 닫고 목록 다시
};

/**
 * 호실 상태 대화상자 — 지금 상태로 고를 수 있는 버튼 · 사용중지 안내, 누르면 바로 바꾼다(확인 창 없음 — spec 결정)
 *
 * @param param0
 * @returns
 */
export default function RoomStateModal({room, onClose, onSaved}: RoomStateModalProps): React.ReactNode {
    // 변수
    const auth = useContext(AuthContext); // 매니저 토큰

    // 상태
    const [saving, setSaving] = useState<boolean>(false); // 바꾸는 중

    // 계산 값
    const actions = roomStateActions(room.room_state_id); // ④ 고를 수 있는 버튼

    // 함수
    async function change(roomStateId: string): Promise<void> {
        // ④ 고른 상태로 바로(큐) → ⑥ 닫고 목록 다시
        if (saving) {
            return;
        }

        const dto = Object.assign(new RoomStateDto(), {room_state_id: roomStateId});
        setSaving(true);
        let failure: {error: unknown} | null = null; // 실패 — 처리는 try 밖에서
        try {
            await updateRoomState(auth, room.room_id, dto);
        } catch (error) {
            failure = {error};
        }

        setSaving(false);
        if (failure) {
            handleApiError(failure.error); // 그 밖의 전환 400 — 받은 문구
            return;
        }

        onSaved();
    }

    return (
        // 상태 대화상자
        <Modal open title={`${room.room_name} · 지금 ${room.room_state_name}`} onClose={onClose} footer={<Button onClick={onClose}>닫기</Button>}>
            <div className={styles.stateActions}>
                {actions.map((action) => <Button key={action.label} variant={action.room_state_id === ROOM_STATE.DISABLED ? 'danger' : 'primary'} disabled={saving} onClick={() => change(action.room_state_id)}>{action.label}</Button>)}
            </div>
            <p className={styles.hint}>사용중지하면 이 호실 예약자는 예약 끝 전까지 전액 환불 취소를 할 수 있습니다.</p>
        </Modal>
    );
}
```

---

## 2. 계산 함수

### 2-1. 상품 설정 보낼 값 — `src/app/manager/(console)/plans/plan-format.ts`

```ts
import { RoomPlanItemResultDto } from '@/contracts/room/dto/room-plan-list.dto';
import { RoomPlanUpdateDto } from '@/contracts/room/dto/room-plan-update.dto';
import { numberOf } from '@/shared/utils/util';

/** 상품 종류 — room_plan_type_id */
export const PLAN_TYPE = {HOURLY: 'HOURLY', NIGHT: 'NIGHT', LONG: 'LONG'} as const;

/** 상품 설정 주소 — 그룹 상품 카드의 링크 */
export const PLANS_PATH = '/manager/plans/';

/** 상품 카드 칸 — 숫자 칸은 입력 글자 그대로 */
export type PlanFormType = {
    is_used: boolean;       // 판매
    days_of_week: number;   // 판매 요일 비트 합(0 이면 고른 요일 없음)
    is_extendable: boolean; // 연장 가능
    max_extensions: string; // 최대 연장 횟수
    usage_hours: string;    // 이용 시간 — 시간 이용
    check_in_time: string;  // 입실 시각(HH:mm) — 1박 · 연박
    check_out_time: string; // 퇴실 시각
    min_nights: string;     // 최소 박수 — 연박
    max_nights: string;     // 최대 박수
};

/**
 * 받은 상품 설정 → 카드 칸(null 은 빈 칸)
 *
 * @param plan 상품 설정 1개
 */
export function planFormOf(plan: RoomPlanItemResultDto): PlanFormType {
    return {
        is_used: plan.is_used === 1,
        days_of_week: plan.days_of_week,
        is_extendable: plan.is_extendable === 1,
        max_extensions: String(plan.max_extensions),
        usage_hours: plan.usage_hours === null ? '' : String(plan.usage_hours),
        check_in_time: plan.check_in_time ?? '',
        check_out_time: plan.check_out_time ?? '',
        min_nights: plan.min_nights === null ? '' : String(plan.min_nights),
        max_nights: plan.max_nights === null ? '' : String(plan.max_nights),
    };
}

/**
 * 상품 설정 보낼 값 — 판매 · 요일 · 연장은 늘, 시간 이용은 이용 시간만, 1박은 입실 · 퇴실만, 연박은 시각 + 최소 · 최대 박수
 * - 종류가 받지 않는 칸은 넣지 않는다(DTO 는 선택 필드 — 백엔드가 종류로 가른다). 빈 칸은 undefined → 백엔드가 그 칸 오류
 *
 * @param type 상품 종류
 * @param form 카드 칸
 */
export function toPlanUpdateDto(type: string, form: PlanFormType): RoomPlanUpdateDto {
    const common = {is_used: form.is_used ? 1 : 0, days_of_week: form.days_of_week, is_extendable: form.is_extendable ? 1 : 0, max_extensions: numberOf(form.max_extensions)};
    if (type === PLAN_TYPE.HOURLY) {
        return Object.assign(new RoomPlanUpdateDto(), common, {usage_hours: numberOf(form.usage_hours)});
    }

    const times = {check_in_time: form.check_in_time || undefined, check_out_time: form.check_out_time || undefined};
    if (type === PLAN_TYPE.NIGHT) {
        return Object.assign(new RoomPlanUpdateDto(), common, times);
    }

    return Object.assign(new RoomPlanUpdateDto(), common, times, {min_nights: numberOf(form.min_nights), max_nights: numberOf(form.max_nights)});
}
```

### 2-2. 마지막으로 연 시각 글자 · 층 이름 · 상태별 고를 수 있는 버튼 — `src/app/manager/(console)/rooms/room-format.ts`

```ts
/** 호실 상태 — room_state_id */
export const ROOM_STATE = {AVAILABLE: 'AVAILABLE', RESERVED: 'RESERVED', IN_USE: 'IN_USE', MAINTENANCE: 'MAINTENANCE', DISABLED: 'DISABLED'} as const;

/** 호실 상태 배지 색 — 시안 M4(예약가능 ok · 예약완료 pri · 사용중 use · 정비중 warn · 사용중지 err) */
export const ROOM_STATE_TONE: Record<string, 'ok' | 'primary' | 'inuse' | 'warn' | 'danger'> = {
    [ROOM_STATE.AVAILABLE]: 'ok',
    [ROOM_STATE.RESERVED]: 'primary',
    [ROOM_STATE.IN_USE]: 'inuse',
    [ROOM_STATE.MAINTENANCE]: 'warn',
    [ROOM_STATE.DISABLED]: 'danger',
};

/** 상태 대화상자 버튼 하나 */
export type RoomStateActionType = {
    label: string;                                                                    // 버튼 글자
    room_state_id: typeof ROOM_STATE.AVAILABLE | typeof ROOM_STATE.DISABLED;          // 바꿀 상태 — RoomStateDto 가 받는 두 값
};

/**
 * 상태별 고를 수 있는 버튼 — 정비중 → 정비 완료 · 사용중지, 사용중지 → 사용 재개, 그 밖(예약가능 · 예약완료 · 사용중) → 사용중지
 * - 백엔드가 허락하는 전환만(RoomStateDto — 그 밖은 400)
 *
 * @param roomStateId 지금 상태
 */
export function roomStateActions(roomStateId: string): Array<RoomStateActionType> {
    if (roomStateId === ROOM_STATE.MAINTENANCE) {
        return [{label: '정비 완료', room_state_id: ROOM_STATE.AVAILABLE}, {label: '사용중지', room_state_id: ROOM_STATE.DISABLED}];
    }

    if (roomStateId === ROOM_STATE.DISABLED) {
        return [{label: '사용 재개', room_state_id: ROOM_STATE.AVAILABLE}];
    }

    return [{label: '사용중지', room_state_id: ROOM_STATE.DISABLED}];
}

/** 문을 마지막으로 연 시각 모양 — 한국 시각 yyyyMMddHHmmss */
const OPENED_AT_PATTERN = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})\d{2}$/;

/**
 * 마지막으로 연 시각 글자 — 'YYYY-MM-DD HH:mm'(이미 한국 시각이라 시간대를 바꾸지 않는다, 초는 뺀다), 없거나 모양이 틀리면 '-'
 * - toKst 는 ISO 를 받아 시간대를 바꾸는 함수라 쓰지 않는다
 *
 * @param value door_opened_at
 */
export function formatOpenedAt(value: string | null | undefined): string {
    const match = value ? OPENED_AT_PATTERN.exec(value) : null;
    if (!match) {
        return '-';
    }

    const [, year, month, day, hour, minute] = match;
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 층 이름 — 지상 '3층', 지하 'B1'
 *
 * @param floor 층(지하는 음수)
 */
export function floorLabel(floor: number): string {
    return floor < 0 ? `B${Math.abs(floor)}` : `${floor}층`;
}
```

---

## 3. 규약만으로 예측할 수 없는 부분

### 3-1. DTO 사본 — 변경 문서 반영 3개 · 룩업 `door_state` 지움

지침서 `frontend/dto/room.md` 의 22개를 그대로 옮기되, 아래 3개 클래스는 변경 문서 모양으로 둔다(지침서는 옛 모양 — 변경 문서가 우선, 주석은 다른 사본과 같은 `/** */`). 나머지 클래스 · import 는 지침서 그대로.

```ts
// src/contracts/room/dto/room-door-open.dto.ts — RoomDoorOpenResultDto 만 바꿈(frontend/changes/2026-11-19-door-state-removed.md)
/**
 * 바로 열기 결과 — 서버는 마지막으로 연 시각을 쓰고 그 업체 문 소켓에 열기 명령(door.open)을 보낸다. 실제 문은 문 쪽 프로그램이 연다(열림 · 닫힘 상태는 두지 않는다)
 */
export class RoomDoorOpenResultDto {
    /** 연 문의 호실 ID */
    room_id: string;

    /** 문을 마지막으로 연 시각 — 한국 시각 yyyyMMddHHmmss(방금 바로 열기를 한 시각) */
    door_opened_at: string;
}
```

```ts
// src/contracts/room/dto/room-list.dto.ts — RoomListItemResultDto · RoomListResultDto 만 바꿈(2026-11-19 · 2026-11-20)
export class RoomListItemResultDto {
    // room_id ~ created_at 은 지침서 그대로

    /** 문을 마지막으로 연 시각 — 한국 시각 yyyyMMddHHmmss(QR 확인이 맞았거나 바로 열기를 한 때 — 실제로 문이 열린 시각은 아니다), 연 적 없으면 null */
    door_opened_at: string | null;
}

export class RoomListResultDto {
    /** 목록 (층 · 호실명 순) */
    list: RoomListItemResultDto[];

    /** 페이지 정보 */
    pagination: PaginationResultDto;

    /** 내 업체 호실이 있는 층 전부 (오름차순 — 거르기 · 페이지와 상관없이, 층 거르기 선택지) */
    floors: number[];
}
```

```ts
// src/contracts/room/dto/room-group-detail.dto.ts — 3개 바꿈 · 1개 더함(frontend/changes/2026-11-20-room-group-detail-floors.md)
export class RoomGroupDetailPlanResultDto {
    // room_plan_type_id ~ price 는 지침서 그대로

    /** 이 상품의 기간 가격 수 (지워지지 않은 것 — 지난 기간 포함) */
    price_count: number;
}

/**
 * 객실 그룹 상세의 호실 — 지워지지 않은 호실
 */
export class RoomGroupDetailRoomResultDto {
    /** 호실 ID */
    room_id: string;

    /** 호실명 (예: 101호) */
    room_name: string;

    /** 층 (지하는 음수, B1 = -1) */
    floor: number;
}

export class RoomGroupDetailResultDto {
    // room_group_id ~ plans 는 지침서 그대로

    /** 호실 수 (지워지지 않은 호실) — 그룹 목록의 room_count 와 같은 값 */
    room_count: number;

    /** 이 그룹의 호실 (지워지지 않은 호실, 층 · 호실명 순) */
    rooms: RoomGroupDetailRoomResultDto[];

    // created_at · updated_at 은 지침서 그대로
}
```

```ts
// src/contracts/common/lookup.ts — 지움(문 상태가 없어졌다 — 쓰는 곳 없음)
    door_state: {open: '열림', close: '닫힘'},
```

### 3-2. 받은 칸 오류를 그 키의 칸에 — `handleApiError` (`src/shared/api/error.ts`)

지금은 받은 `validation_errors` 를 이름만으로 찾아 같은 이름의 첫 칸에 붙인다 — 상품 카드 3개 · 그룹 상품 줄 3개에서 다른 카드에 붙는다. 검사 쪽은 이미 키를 받으므로(`validateActionChildren(dto, key)` · `showValidationErrors(errors, key)` — `src/shared/utils/validation.ts:32,112`) 받은 오류도 같은 키를 넘긴다. 키가 없으면 지금과 같다.

```ts
/**
 * API 실패 처리 — validation_errors 는 칸 옆(맞는 칸이 없으면 오류 팝업), 없으면 message 를 오류 팝업으로 …
 *
 * @param error 잡은 오류
 * @param isReset 칸 오류를 먼저 지울지
 * @param key 칸 오류 키 — 같은 이름의 칸이 여럿인 화면에서 그 카드 · 줄(Field dataKey)에만 붙인다
 */
export function handleApiError(error: unknown, isReset: boolean = true, key?: string): void {
    // … (위는 그대로)
    const {message, validation_errors} = error.body;
    if (validation_errors && validation_errors.length > 0) {
        if (isReset) {
            resetValidationError();
        }

        if (showValidationErrors(validation_errors, key) === 0) {
            showErrorPopup(message);
        }
        return;
    }
    // … (아래는 그대로)
}
```

같은 이유로 안쪽 DTO(그룹의 `room_group_detail`)는 `validateAction(dto)` 가 칸에 붙이지 못한다(`toValidationErrors` 가 constraints 없는 안쪽 오류를 건너뛴다 — `validation.ts:65-78`). 그래서 그룹 검사는 부모 + 안쪽을 따로 본다 — 아래 3-5 `validateRoomGroup`.

### 3-3. 고르기 상자 — `Select` (`src/shared/components/ui/form/Select.tsx`)

호실 거르기(층 · 그룹) · 호실 등록(그룹)에 고르기 상자가 필요한데 공통 부품이 없다(`src/shared/components/ui/form/` — Chip · Field · FieldError · Input · Segmented · Switch · Textarea). 관리자 목록 거르기(Phase 16 · 17)도 쓰므로 공통 부품으로 둔다. 모양은 `Textarea` 처럼 `Input.module.css` 를 함께 쓴다(`src/shared/components/ui/form/Textarea.tsx:2`).

```tsx
import type { ComponentProps } from 'react';
import styles from '@/shared/css/ui/form/Input.module.css';

type SelectProps = ComponentProps<'select'> & {
    invalid?: boolean; // 오류 테두리
};

/**
 * 고르기 상자 — 한 줄 입력과 같은 모양(화살표는 브라우저 기본)
 *
 * @param param0
 * @returns
 */
export default function Select({invalid = false, className, ...rest}: SelectProps): React.ReactNode {
    // 변수
    const classNames = [styles.input, invalid ? styles.invalid : '', className ?? ''].filter(Boolean).join(' '); // 기본 · 오류 · 밖에서 넘긴 클래스

    return (
        // 고르기 상자
        <select className={classNames} aria-invalid={invalid || undefined} {...rest} />
    );
}
```

### 3-4. `numberOf` 를 공용으로 · 요일 이름 복제 정리

`numberOf` 는 내 업체 설정(`store-settings-format.ts:113` — `StorePolicyTab.tsx:17` 이 씀)에 있는데 이번에 상품 설정 · 그룹 · 호실이 쓴다 — 두 곳 이상이라 `src/shared/utils/util.ts` 로 옮긴다(AGENTS.md "두 곳 이상에서 쓰게 되면 그때 옮긴다"). 같은 파일의 `DAY_NAMES`(19줄)는 `src/shared/utils/format.ts:12` 와 같은 값의 복제라 지우고 `format.ts` 것을 쓴다(`hourRowsOf` · `StoreHoursTab.tsx:16`).

```ts
// src/shared/utils/util.ts — 더함(store-settings-format.ts 에서 옮김, 본문 그대로)
/**
 * 숫자 칸 값 → DTO 숫자 — 비었으면 undefined(IsNotEmpty 문구), 숫자가 아니면 NaN(IsInt 문구)
 *
 * @param value 칸 값
 */
export function numberOf(value: string): number | undefined {
    return value.trim() === '' ? undefined : Number(value);
}

// src/app/manager/(console)/store/store-settings-format.ts — numberOf · DAY_NAMES 지우고
import { DAY_NAMES } from '@/shared/utils/format';
// src/app/manager/(console)/store/_components/StorePolicyTab.tsx:17
import { policySummary } from '../store-settings-format';
import { numberOf } from '@/shared/utils/util';
// src/app/manager/(console)/store/_components/StoreHoursTab.tsx:16 — DAY_NAMES 는 '@/shared/utils/format' 에서
```

### 3-5. 그룹 칸 ↔ DTO · 그룹 검사 — `src/app/manager/(console)/room-groups/room-group-format.ts`

목록(등록 — `RoomGroupDto`)과 상세(수정 — `RoomGroupUpdateDto`)가 같은 칸을 쓴다. 설명은 빈 글자로 보낸다(지침서 "비우면 null" — 빠뜨리면 수정 때 지우지 못한다). 편의시설은 늘 4개 모두 보낸다(수정은 "보내면 통째로").

```ts
import { RoomGroupDetailResultDto } from '@/contracts/room/dto/room-group-detail.dto';
import { RoomGroupUpdateDetailDto, RoomGroupUpdateDto } from '@/contracts/room/dto/room-group-update.dto';
import { RoomGroupDetailInputDto, RoomGroupDto } from '@/contracts/room/dto/room-group.dto';
import { numberOf } from '@/shared/utils/util';
import { validateAction, validateActionChildren } from '@/shared/utils/validation';

/** 객실 그룹 목록 주소 */
export const ROOM_GROUP_LIST_PATH = '/manager/room-groups/';

/** 방 개수 칸 오류 키 — 안쪽 DTO(room_group_detail) */
export const ROOM_GROUP_DETAIL_KEY = 'room_group_detail';

/** 그룹 사진 최대 장수 — RoomGroupImageOrderDto */
export const ROOM_GROUP_IMAGE_MAX = 5;

/** 그룹 칸 */
export type RoomGroupFormType = {
    room_group_name: string; // 그룹명
    description: string;     // 설명
    room_count: string;      // 방 개수 칸 글자
    has_shower: boolean;     // 샤워실
    has_tv: boolean;         // TV
    has_pc: boolean;         // PC
};

/** 등록 대화상자 빈 칸 — 백엔드 기본값(방 1 · 편의시설 모두 있음)과 같게 */
export const EMPTY_ROOM_GROUP_FORM: RoomGroupFormType = {room_group_name: '', description: '', room_count: '1', has_shower: true, has_tv: true, has_pc: true};

/**
 * 그룹 상세 주소
 *
 * @param roomGroupId 그룹 ID
 */
export function roomGroupPath(roomGroupId: string): string {
    return `${ROOM_GROUP_LIST_PATH}${encodeURIComponent(roomGroupId)}/`;
}

/**
 * 받은 그룹 상세 → 그룹 칸
 *
 * @param group 그룹 상세
 */
export function roomGroupFormOf(group: RoomGroupDetailResultDto): RoomGroupFormType {
    const detail = group.room_group_detail;
    return {room_group_name: group.room_group_name, description: group.description ?? '', room_count: String(detail.room_count), has_shower: detail.has_shower === 1, has_tv: detail.has_tv === 1, has_pc: detail.has_pc === 1};
}

/**
 * 편의시설 값 — 4개 모두(0 · 1)
 *
 * @param form 그룹 칸
 */
function detailValuesOf(form: RoomGroupFormType): {room_count: number | undefined; has_shower: number; has_tv: number; has_pc: number} {
    return {room_count: numberOf(form.room_count), has_shower: form.has_shower ? 1 : 0, has_tv: form.has_tv ? 1 : 0, has_pc: form.has_pc ? 1 : 0};
}

/**
 * 그룹 등록 보낼 값
 *
 * @param form 그룹 칸
 */
export function toRoomGroupDto(form: RoomGroupFormType): RoomGroupDto {
    return Object.assign(new RoomGroupDto(), {room_group_name: form.room_group_name.trim(), description: form.description.trim(), room_group_detail: Object.assign(new RoomGroupDetailInputDto(), detailValuesOf(form))});
}

/**
 * 그룹 수정 보낼 값 — 편의시설 통째로
 *
 * @param form 그룹 칸
 */
export function toRoomGroupUpdateDto(form: RoomGroupFormType): RoomGroupUpdateDto {
    return Object.assign(new RoomGroupUpdateDto(), {room_group_name: form.room_group_name.trim(), description: form.description.trim(), room_group_detail: Object.assign(new RoomGroupUpdateDetailDto(), detailValuesOf(form))});
}

/**
 * 그룹 검사 — 그룹명 · 설명은 validateAction(칸 오류를 먼저 지움), 방 개수는 안쪽 DTO 라 키로 따로(validateAction 은 안쪽 오류를 칸에 붙이지 못한다)
 *
 * @param dto 등록 · 수정 DTO
 */
export async function validateRoomGroup(dto: RoomGroupDto | RoomGroupUpdateDto): Promise<boolean> {
    const groupOk = await validateAction(dto);
    const detailOk = dto.room_group_detail ? await validateActionChildren(dto.room_group_detail, ROOM_GROUP_DETAIL_KEY) : true;
    return groupOk && detailOk;
}

/**
 * 머리 호실 글자 — "호실 3개(203호 · 301호 · 302호)", 없으면 "호실 0개"
 *
 * @param group 그룹 상세
 */
export function roomsText(group: RoomGroupDetailResultDto): string {
    const names = group.rooms.map((room) => room.room_name).join(' · ');
    return names ? `호실 ${group.room_count}개(${names})` : `호실 ${group.room_count}개`;
}
```

---

## 4. 기존 패턴 그대로 — 코드 생략

| 대상 | 따르는 패턴 | 근거 |
|---|---|---|
| DTO 사본 22개(`room-*`) | 지침서 블록 그대로, 상대 import(`../../common/pagination.dto`) 유지 — 3개 클래스만 3-1 | `src/contracts/store/dto/store-mine-unavailable-period-list.dto.ts` |
| 조회 `getRoomPlans(auth, signal?)` · `getRoomGroup(auth, id, signal?)` | `withAuth` + `request` GET `/admin-service/room/plan` · `/room/group/<id>`(`encodeURIComponent`) | `src/contracts/store/api.ts` `getMyStore` |
| 목록 `getRoomGroups(auth, query, signal?)` · `getRooms(auth, query, signal?)` · `getRoomGroupPlanPrices(auth, id, type, query, signal?)` | `withAuth` + `request` — query `{page, size, all_search_yn, keyword}` · `{page, size, floor, room_group_id}` · `{page, size}`(null 은 `createQueryString` 이 뺀다) | `src/contracts/store/api.ts` `getMyUnavailablePeriods` |
| 큐 쓰기 — `updateRoomPlan(auth, type, dto)` · `updateRoomGroup` · `updateRoomGroupPlan(auth, id, type, dto)` · `updateRoomGroupPlanPrice(auth, id, type, priceId, dto)` · `updateRoom` · `updateRoomState`(PATCH) · `reorderRoomGroupImages`(PUT) · `deleteRoomGroup` · `deleteRoomGroupImage` · `deleteRoomGroupPlanPrice` · `deleteRoom`(DELETE) — `Promise<null>` | `withAuth` + `callQueue<null>`, 경로 조각은 `encodeURIComponent` | `src/contracts/store/api.ts` `updateMyStoreProfile` · `deleteMyUnavailablePeriod` |
| 큐 등록 — `createRoomGroup` · `registerRoomGroupImage` · `createRoomGroupPlanPrice` · `createRoom`(POST, 결과 DTO \| null) | `withAuth` + `callQueue<결과 DTO>` | `src/contracts/store/api.ts` `createMyUnavailablePeriod` |
| 동기 쓰기 — `issueRoomGroupImageUrl(auth, id, dto)` · `openRoomDoor(auth, id)`(POST, 결과 DTO \| null) | `withAuth` + `request` POST `/room/group/<id>/image/upload-url` · `/room/<id>/door-open`(본문 없음) | `src/contracts/store/api.ts` `issueMyStoreFileUrl` |
| `RoomGroupPhotos` 의 올리기 · 순서 · 삭제 · 확인 창 | 1-3 의 다른 줄 말고는 같은 흐름 | `src/app/manager/(console)/store/_components/StorePhotosTab.tsx:47-111` |
| `plans/page.tsx` · `room-groups/page.tsx` · `rooms/page.tsx` | 얇은 page — `<…Content />`(로그인 가드는 콘솔 layout) | `src/app/manager/(console)/store/page.tsx` |
| `room-groups/[room_group_id]/page.tsx` | `PageProps<'/manager/room-groups/[room_group_id]'>` 의 `await params` → `<RoomGroupDetailContent roomGroupId={room_group_id} />` | `src/app/(user)/store-applications/[store_application_id]/page.tsx` |
| 그룹 카드 대표 사진 | `next/image` + `unoptimized`(CDN 주소) | `src/app/(user)/store-applications/[store_application_id]/_components/ApplicationFiles.tsx:121` |

## 5. 스타일 — 시안 값

시안 `frontend/design/manager.html` M4 · M5 · M6(`.phd` · `.pt` · `.ps` · `.fb` · `.gcards` · `.gcard` · `.gb` · `.plans` · `.days` · `.unit` · `.fg` · `.kv` · `.acts` · `.crumb`)을 토큰으로. 크기는 콘솔(`data-area="console"`). 머리(`.page` · `.head` · `.title` · `.subtitle`)는 화면 css 마다 같은 모양(`StoreSettingsContent.module.css`).

```css
/* 화면 머리 — PlansContent · RoomGroupListContent · RoomGroupDetailContent · RoomsContent 공통 모양 */
.page { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
.title { margin: 0; font-size: 22px; font-weight: 700; }
.subtitle { margin: 6px 0 0; font-size: 13px; color: var(--muted); }
.hint { margin: 0; font-size: 13px; line-height: 1.6; color: var(--muted); }
.number { font-variant-numeric: tabular-nums; }
.srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.unit { display: flex; align-items: center; gap: 8px; }
.unit input { width: 120px; }
.unit > span { font-size: 14px; color: var(--muted); white-space: nowrap; }
.acts { display: flex; flex-wrap: wrap; gap: 6px; }

/* PlansContent · PlanCard — 시안 .plans · .days · .kv */
.plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; align-items: start; }
.days { display: flex; flex-wrap: wrap; gap: 6px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; }
.kv { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.sep { height: 1px; margin: 4px 0; border: 0; background: var(--line); }
.actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 12px; }
.saved { font-size: 13px; color: var(--ok); }

/* RoomGroupListContent — 시안 .fb · .gcards · .gcard · .gb */
.search { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.searchField { width: 280px; max-width: 100%; }
.label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 700; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.card { display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface); color: var(--fg); text-decoration: none; }
.image { position: relative; aspect-ratio: 4 / 3; background: var(--neutral-bg); }
.img { object-fit: cover; }
.noImage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--muted); }
.body { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; }
.body b { font-size: 15px; }
.body span { font-size: 13px; color: var(--muted); }

/* RoomGroupForm — 시안 M5 기본 정보 */
.form { display: flex; flex-direction: column; gap: 16px; }
.amenities { display: flex; flex-wrap: wrap; gap: 16px; margin: 0; padding: 0; border: 0; }
.legend { margin-bottom: 8px; padding: 0; font-size: 13px; font-weight: 700; }
.actions { display: flex; justify-content: flex-end; } /* RoomGroupInfoCard 저장 줄도 이 파일 */

/* RoomGroupDetailContent — 시안 .crumb · 두 칸 */
.crumb { margin: 0 0 6px; font-size: 13px; color: var(--muted); }
.cols { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; }
.cols > * { flex: 1 1 420px; min-width: 0; }

/* RoomGroupPlans · RoomGroupPrices */
.link { font-size: 13px; }
.dates { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }

/* RoomsContent — 시안 .fb(층 140px · 그룹 220px) · 상태 대화상자 */
.filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
.floorFilter { width: 140px; }
.groupFilter { width: 220px; max-width: 100%; }
.stateActions { display: flex; flex-direction: column; gap: 8px; }
```

## 테스트

spec 의 "결과" 표에서 ✓ 표시된 12건과 "계산 규칙" 표 11건을 그대로 테스트로 옮긴다. 여기에는 추가분이 없다.

테스트 파일과 경계 mock(`@/contracts/room/api` mock · 매니저 토큰은 `src/test/app/manager/(console)/store/store-fixture.tsx` 의 `MANAGER_AUTH` · `renderWithManager`, `next/navigation` 의 `useRouter` 는 `push` mock — `src/test/app/(user)/HomeContent.test.tsx` 모양):
- 계산 — `src/test/app/manager/(console)/plans/plan-format.test.ts`(보낼 값 3 — 본문을 `JSON.parse(JSON.stringify(dto))` 로 비교해 빠진 칸까지), `src/test/app/manager/(console)/rooms/room-format.test.ts`(연 시각 3 · 층 이름 2 · 상태 버튼 3)
- 상품 설정 — `plans/PlansContent.test.tsx`: 1박 카드 요일을 모두 끄고 저장 → `span[data-id="days_of_week"][data-key="NIGHT"]` 문구, `HOURLY` 카드 칸은 비어 있음, `updateRoomPlan` 0번
- 그룹 목록 — `room-groups/RoomGroupListContent.test.tsx`: 등록 → `createRoomGroup` 1번(그룹명 · 설명 · `room_group_detail` 4개) → `push('/manager/room-groups/<id>/')` / 그룹명 비움 → 칸 문구 · 등록 0번
- 그룹 상세 — `room-groups/[room_group_id]/RoomGroupDetailContent.test.tsx`(`ImageUploader` 는 빈 부품으로 mock — dnd 를 jsdom 에서 그리지 않는다): 기본 정보 저장 → `updateRoomGroup` 1번 인자 · `getRoomGroup` 2번 / 방 개수 0 → `span[data-id="room_count"][data-key="room_group_detail"]` 문구 · 0번 / 1박 판매 켬 · 59000 → `updateRoomGroupPlan(auth, id, 'NIGHT', {is_used: 1, price: 59000})` 1번 · 다시 / 삭제 확인 → `deleteRoomGroup` 1번 → `push('/manager/room-groups/')`
- 기간 가격 — `room-groups/[room_group_id]/_components/RoomGroupPrices.test.tsx`: 추가 → `createRoomGroupPlanPrice(auth, id, 'NIGHT', {start_date, end_date, price: 95000, memo})` 1번 → 목록 2번째 호출 · `onChanged` 1번 · 대화상자 닫힘 / 요금 0 → `span[data-id="price"][data-key="plan_price"]` 문구 · 0번
- 호실 — `rooms/RoomsContent.test.tsx`: 등록 → `createRoom` 1번(그룹 ID · 호실명 · 층 숫자 3) → `getRooms` 2번 / 층 300 → 칸 문구 · 0번 / 문 열기 → `openRoomDoor(auth, room_id)` 1번 → 그 줄 `2026-11-20 09:05` · `getRooms` 1번만
- 픽스처 — `src/test/app/manager/(console)/room-fixture.tsx`(상품 3개 · 그룹 상세(호실 2 · 사진 1 · `price_count`) · 기간 가격 목록 · 호실 목록(`floors` · `door_opened_at`))
- React Compiler 회귀 테스트(`src/test/react-compiler.test.ts`)가 새 컴포넌트를 모두 컴파일하는지 함께 본다.

## 만드는 순서

1. DTO 사본 22개(3-1 의 3개 클래스) → `src/contracts/room/api.ts` 22개 → 룩업 `door_state` 지움
2. 공용 — `numberOf` 옮기기 · 요일 이름 정리(3-4) · `handleApiError` key(3-2) · `Select`(3-3)
3. 계산 함수 + 테스트 — `plan-format.ts`(2-1) · `room-format.ts`(2-2)
4. 상품 설정 — `PlanCard` · `PlansContent`(1-1) + page + css + 테스트
5. 객실 그룹 — `room-group-format.ts`(3-5) · `RoomGroupForm` · `RoomGroupListContent`(1-2) → `RoomGroupInfoCard` · `RoomGroupPhotos` · `RoomGroupPlans` · `RoomGroupDetailContent`(1-3) → `RoomGroupPrices`(1-4) + page 2개 + css + 테스트
6. 호실 — `RoomFormModal` · `RoomStateModal` · `RoomsContent`(1-5) + page + css + 테스트
7. `npx next typegen && npx tsc --noEmit` · `npx vitest run`(AGENTS.md 가 허용)
8. 문서 — AGENTS.md(공통 부품 form 에 `Select`, Validation 줄: 같은 이름 칸이 여럿이면 `Field dataKey` + `validateActionChildren(dto, key)` + `handleApiError(error, true, key)` — "미적용" 지움, 표시 형식 줄에 `numberOf`), `docs/conventions.md`(같은 이름 칸 나누기 · 안쪽 DTO 검사), `docs/error-handling.md`(`handleApiError` 의 key), `docs/data-layer.md:46`(반영한 문서에 `2026-11-19-door-state-removed.md` · `2026-11-20-room-group-detail-floors.md` 더함)
