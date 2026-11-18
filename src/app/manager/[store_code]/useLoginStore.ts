'use client';
import { useEffect, useState } from 'react';
import { getLoginStore } from '@/contracts/store/api';
import { StoreLoginStoreResultDto } from '@/contracts/store/dto/store-login-store.dto';
import { handleApiError } from '@/shared/api/error';
import { ApiError } from '@/shared/api/request';

/** 업체 확인 결과 — 확인 중 · 있음 · 없음 · 영업중지 · 확인 못 함 */
export type UseLoginStoreType =
    | {status: 'loading'}
    | {status: 'ok'; store: StoreLoginStoreResultDto}
    | {status: 'not-found'}
    | {status: 'suspended'; message: string; suspendComment: string | null}
    | {status: 'unknown'};

/**
 * 업체 확인 실패 → 결과 — 404 없음, 400 영업중지(+ 정지 사유), 그 밖은 확인 못 함
 * - 컴포넌트 밖(React Compiler — 값 계산)
 *
 * @param error 업체 확인 실패
 */
function loginStoreFailureOf(error: unknown): UseLoginStoreType {
    if (error instanceof ApiError && error.status === 404) {
        return {status: 'not-found'};
    }

    if (error instanceof ApiError && error.status === 400) {
        const suspendComment = typeof error.body.suspend_comment === 'string' && error.body.suspend_comment ? error.body.suspend_comment : null;
        return {status: 'suspended', message: error.body.message, suspendComment};
    }

    return {status: 'unknown'};
}

/**
 * 주소의 업체코드로 업체 확인 — 업체 로그인 · 아이디 찾기 · 비밀번호 초기화가 열릴 때(frontend/changes/2026-11-18-store-login-store.md)
 *
 * @param storeCode 주소의 업체코드
 */
export default function useLoginStore(storeCode: string): UseLoginStoreType {
    // 상태
    const [result, setResult] = useState<UseLoginStoreType>({status: 'loading'}); // 업체 확인 결과

    // 효과
    useEffect(() => {
        // 업체 확인 1번 — 확인 못 함(네트워크 · 5xx)은 공통 안내(떠나면 결과를 버린다)
        const controller = new AbortController();
        getLoginStore(storeCode, controller.signal).then((store) => {
            if (!controller.signal.aborted) {
                setResult(store ? {status: 'ok', store} : {status: 'not-found'});
            }
        }).catch((error: unknown) => {
            if (controller.signal.aborted) {
                return;
            }

            const failure = loginStoreFailureOf(error);
            if (failure.status === 'unknown') {
                handleApiError(error);
            }
            setResult(failure);
        });

        return () => {
            controller.abort();
        };
    }, [storeCode]);

    return result;
}
