import { IsNotEmpty, Matches } from 'class-validator';
import { STORE_CODE_PATTERN } from '../manager-auth';

/**
 * 업체코드 칸 — 지침서 ManagerLoginDto(src/contracts/manager/dto/manager-login.dto.ts)의 store_code 와 같은 규칙 · 메시지
 * - API 없이 그 업체 로그인 주소로 보낼 때만 쓴다
 */
export class StoreCodeDto {
    /** 업체코드 (32자 영문 소문자 · 숫자 — 로그인 주소 안의 값) */
    @Matches(STORE_CODE_PATTERN, {message: '업체코드가 올바르지 않습니다.'})
    @IsNotEmpty({message: '업체코드를 입력해주세요.'})
    store_code: string;
}
