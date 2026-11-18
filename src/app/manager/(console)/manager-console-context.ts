'use client';
import { createContext } from 'react';
import { StoreMineResultDto } from '@/contracts/store/dto/store-mine.dto';
import { AreaAccountType } from '@/shared/api/cookie';

/** 콘솔 틀이 나눠 주는 값 — 대시보드(영업중지 띠) · 내 업체 설정(Phase 11) */
export type ManagerConsoleContextType = {
    store: StoreMineResultDto | null;                      // 내 업체 상세 — 아직 · 못 읽었으면 null
    account: AreaAccountType | null;                       // 로그인 때 기억한 계정(아이디 · 권한) — 쿠키가 없으면 null
    reloadStore: () => Promise<StoreMineResultDto | null>; // 다시 읽기(내 업체 설정을 바꾼 뒤) — 못 읽으면 이전 값을 두고 null
};

export const ManagerConsoleContext = createContext<ManagerConsoleContextType>({store: null, account: null, reloadStore: async () => null});
