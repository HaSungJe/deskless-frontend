import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { loginUser, signUser } from '@/contracts/user/api';
import { UserLoginResultDto } from '@/contracts/user/dto/user-login.dto';
import { UserSignDto, UserSignResultDto } from '@/contracts/user/dto/user-sign.dto';
import { NETWORK_ERROR_MESSAGE } from '@/shared/api/error';
import { QUEUE_PENDING_MESSAGE } from '@/shared/api/queue';
import { ApiError } from '@/shared/api/request';
import { setTokenCookies } from '../../cookie/token-cookie';
import { isSameSiteJson, json } from '../../route-util';
import { clearSnsSession, INVALID_REQUEST_MESSAGE, NO_SNS_CODE, readSnsAccount } from '../sns-session';

/**
 * SNS 가입 — 가입 칸에 next-auth 세션의 SNS 계정을 붙여 백엔드 user/sign(큐) → 이용자 토큰 쿠키
 * - 같은 사이트 JSON · SNS 세션이 있을 때만 백엔드를 부른다. 백엔드 실패는 message · validation_errors 그대로
 * - 본문의 sns_id · sns_user_id 는 쓰지 않는다(세션 것만)
 * - 큐가 결과 없이 끝나면(pending · 응답 없음) 가입이 끝났을 수 있어 user/login 으로 한 번 다시 조회한다
 *
 * @param request 본문 {gender, birth, nickname}
 */
export async function POST(request: NextRequest): Promise<Response> {
    if (!isSameSiteJson(request)) {
        return json({success: false, message: INVALID_REQUEST_MESSAGE});
    }

    const account = await readSnsAccount(request);
    if (!account) {
        return json({success: false, code: NO_SNS_CODE});
    }

    const form = (await request.json().catch((): null => null)) as Record<string, unknown> | null;
    const dto = Object.assign(new UserSignDto(), {
        sns_id: account.sns_id,
        sns_user_id: account.sns_user_id,
        gender: textOf(form?.gender),
        birth: textOf(form?.birth),
        nickname: textOf(form?.nickname),
    });

    let result: UserSignResultDto | UserLoginResultDto | null = null;
    let failMessage = QUEUE_PENDING_MESSAGE; // 결과 없이 끝났을 때 문구 — pending 이면 늦어짐, 응답 없음이면 네트워크
    try {
        result = await signUser(dto);
    } catch (error) {
        if (error instanceof ApiError) {
            return json({success: false, message: error.body.message, validation_errors: error.body.validation_errors});
        }

        console.log('[sign] 가입 결과를 받지 못함 —', error instanceof Error ? error.message : error);
        failMessage = NETWORK_ERROR_MESSAGE;
    }

    // 결과 없이 끝남(pending · 스트림 끊김) — 가입이 이미 끝났을 수 있어 로그인으로 다시 조회(가입 전이면 404 → 다시 시도 안내)
    if (!result) {
        result = await loginUser(account).catch((): null => null);
    }
    if (!result) {
        return json({success: false, message: failMessage, retry: true});
    }

    const cookieStore = await cookies();
    await setTokenCookies(cookieStore, 'user', result);
    clearSnsSession(cookieStore);
    return json({success: true, data: {is_phone_verified: result.is_phone_verified}});
}

/**
 * 본문 값 → 글자(아니면 빈 글자 — 백엔드 검증이 칸 오류로 돌려준다)
 *
 * @param value 본문 값
 */
function textOf(value: unknown): string {
    return typeof value === 'string' ? value : '';
}
