'use client';
import { createContext } from 'react';
import { AUTH_ID } from '@/contracts/common/roles';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { AreaAccountType } from '@/shared/api/cookie';

/** 콘솔 틀이 나눠 주는 값 — 대시보드(영업중지 띠) · 내 업체 설정(Phase 11) · 업체 관리자(Phase 14) */
export type ManagerConsoleContextType = {
    store: StoreMineResultDto | null;                      // 내 업체 상세 — 아직 · 못 읽었으면 null
    account: AreaAccountType | null;                       // 로그인 때 기억한 계정(아이디 · 권한) — 아직 읽는 중 · 쿠키가 없으면 null
    accountLoaded: boolean;                                // 계정 쿠키를 다 읽었나 — 읽기 전에는 권한을 판단하지 않는다(읽는 중과 없음을 가른다)
    reloadStore: () => Promise<StoreMineResultDto | null>; // 다시 읽기(내 업체 설정을 바꾼 뒤) — 못 읽으면 이전 값을 두고 null
};

export const ManagerConsoleContext = createContext<ManagerConsoleContextType>({store: null, account: null, accountLoaded: false, reloadStore: async () => null});

/** 영업중지 업체 상태 — store_state_id */
const STORE_SUSPENDED = 'SUSPEND';

/**
 * 내 업체가 영업중지인가 — 대시보드 띠 · 내 업체 설정 띠 · 상태 배지 색
 *
 * @param store 내 업체 상세 — 못 읽었으면 null(영업중지 아님)
 * @returns
 */
export function isStoreSuspended(store: StoreMineResultDto | null): boolean {
    return store?.store_state_id === STORE_SUSPENDED;
}

/**
 * 계정이 업체 총관리자인가 — 업체 관리자 화면 · 문 연동 탭. 계정을 모르면(쿠키 없음) 아니다(안전한 쪽)
 *
 * @param account 로그인 때 기억한 계정 — 없으면 null
 * @returns
 */
export function isHeadManager(account: AreaAccountType | null): boolean {
    return account?.auth_id === AUTH_ID.HEAD_MANAGER;
}
