import {IsNotEmpty} from 'class-validator';

/**
 * 매니저 로그인용 업체 조회 path param — 모양은 검사하지 않는다(틀린 모양은 없는 업체와 같은 404)
 */
export class StoreLoginStoreParamDto {
    // 업체코드 (32자 영문 소문자 · 숫자 — 모양이 달라도 400 이 아니라 404)
    @IsNotEmpty({message: '업체코드를 입력해주세요.'})
    store_code: string;
}

/**
 * 매니저 로그인용 업체 조회 결과 — 활성 업체만
 */
export class StoreLoginStoreResultDto {
    // 업체 ID
    store_id: string;

    // 업체코드 (매니저 로그인 · 아이디 찾기 · 비밀번호 초기화의 store_code)
    store_code: string;

    // 상호명
    store_name: string;
}
