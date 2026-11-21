import { withBasePath } from '@/shared/utils/base-path';
import { ValidationErrorType } from '@/shared/utils/validation';
import { ApiError, ApiFailBodyType, NetworkError, sendRequest } from './request';

/** 프론트 route 응답 본문 — src/app/api/route-util.ts RouteBodyType 과 같은 모양(실패도 200) */
export type RouteResponseType<T> = {
    success: boolean;
    data?: T;
    retry?: boolean;                                       // 일시 실패 — 다시 시도
    message?: string;                                      // 실패 문구
    code?: string;                                         // 화면이 갈래를 나눌 코드(NO_SNS)
    validation_errors?: Array<ValidationErrorType> | null; // 백엔드 칸 오류 그대로
    block_comment?: string | null;                         // 정지 계정 로그인 — 정지 사유
};

/** 로그인 실패 띠 — 받은 문구 · 정지 사유(업체 · 관리자 로그인) */
export type LoginFailureType = {
    message: string;             // "잘못된 로그인 정보입니다." · "이용이 제한된 계정입니다."
    blockComment: string | null; // 정지 사유(403)
};

/** 문구 없이 실패했을 때 */
const LOGIN_FAILED_MESSAGE = '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.';

/**
 * 프론트 route 에 JSON 을 보낸다(POST — 가입 · 업체 로그인 · 관리자 로그인)
 * - route 는 실패도 200 이라 200 이 아니거나 본문을 못 읽으면 응답이 없는 것으로 본다(NetworkError)
 *
 * @param path route 주소('/api/admin/login/' — basePath 는 여기서 붙인다)
 * @param body JSON 본문
 */
export async function postRoute<T>(path: string, body: unknown): Promise<RouteResponseType<T>> {
    const response = await sendRequest(withBasePath(path), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
    if (!response.ok) {
        throw new NetworkError(new Error(`${path} ${response.status}`));
    }

    const result = (await response.json().catch((): null => null)) as RouteResponseType<T> | null;
    if (!result) {
        throw new NetworkError(new Error(`${path} body`));
    }

    return result;
}

/**
 * route 실패 본문 → ApiError — 다시 시도는 503, 그 밖은 400(문구 · 칸 오류 그대로 — handleApiError · 로그인 띠가 읽는다)
 *
 * @param result route 응답 본문(success false)
 * @param withBlockComment 로그인 route 면 true — 정지 사유 칸을 늘 붙인다(없으면 null). 가입은 두 칸만
 */
export function routeFailure(result: RouteResponseType<unknown>, withBlockComment: boolean = false): ApiError {
    const body: ApiFailBodyType = {message: result.message ?? '', validation_errors: result.validation_errors ?? null}; // 실패 본문
    return new ApiError(result.retry ? 503 : 400, withBlockComment ? {...body, block_comment: result.block_comment ?? null} : body);
}

/**
 * 띠로 보일 로그인 실패인지 — 칸 오류가 없는 ApiError(로그인 처리가 넘긴 백엔드 문구 · 다시 시도)
 * - 컴포넌트 밖(React Compiler — catch 안 값 계산을 건너뛴다)
 *
 * @param error 로그인 처리 실패
 * @returns 띠 내용, 칸 오류 · 그 밖의 오류면 null(공통 처리)
 */
export function loginFailureOf(error: unknown): LoginFailureType | null {
    if (!(error instanceof ApiError) || (error.body.validation_errors?.length ?? 0) > 0) {
        return null;
    }

    const blockComment = typeof error.body.block_comment === 'string' && error.body.block_comment ? error.body.block_comment : null;
    return {message: error.body.message || LOGIN_FAILED_MESSAGE, blockComment};
}
