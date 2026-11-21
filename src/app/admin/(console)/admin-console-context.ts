'use client';
import { createContext } from 'react';
import { AreaAccountType } from '@/shared/api/cookie';

/** 콘솔 틀이 나눠 주는 값 — 비밀번호 변경(설명 줄의 아이디) */
export type AdminConsoleContextType = {
    account: AreaAccountType | null; // 로그인 때 기억한 계정(아이디 · 권한) — 아직 읽는 중 · 쿠키가 없으면 null
};

export const AdminConsoleContext = createContext<AdminConsoleContextType>({account: null});
