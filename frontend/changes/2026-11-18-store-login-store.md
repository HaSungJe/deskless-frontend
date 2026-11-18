# 매니저 로그인용 업체 조회 API 추가 — 프론트 수정 요청 (2026-11-18)

- 백엔드: spec `.beaver/output/spec/store/store-login-store-spec.md` · revision `.beaver/output/revision/store/store-login-store-revision-261118-1.md`(업체코드로 조회) · 커밋 2026.11.18
- 반영 순서: 백엔드 배포 먼저 — API 를 하나 더할 뿐이라 지금 화면은 그대로 동작한다

## 바뀐 이유
매니저 로그인 화면이 주소의 업체코드(`/manager/[store_code]/login`)로 그 업체가 있는지 · 이름이 무엇인지 먼저 확인하려고 만든다. 지금은 업체코드가 틀려도 로그인 버튼을 누르기 전까지 알 수 없고, 틀리면 404 "잘못된 로그인 정보입니다." 로 아이디 · 비밀번호가 틀린 것처럼 보인다.
- 업체코드는 업체 ID 와 다른 값이다(테스트 데이터: 업체 ID `5a3e01…`, 업체코드 `5a3e02…`) — 이 API · 로그인 · 아이디 찾기 · 비밀번호 초기화에는 **업체코드**를 넣는다.

## 영향 화면
- M1 업체 관리자 로그인 · 아이디 찾기 · 비밀번호 초기화(`/manager/[store_code]/…`) — 화면이 열릴 때 업체 확인

## API 변경
| 구분 | 메서드 · 주소 | 방식 | 바뀐 점 |
|---|---|---|---|
| 추가 | `GET /api/v1/admin-service/store/login-store/:store_code` | 동기 · 로그인 없음 | 업체코드 → 업체 ID · 업체코드 · 업체명 |

응답:

| 상황 | 상태 | 본문 |
|---|---|---|
| 활성 업체 | 200 | `{store_id, store_code, store_name}` |
| 없는 업체 · 탈퇴한 업체 · 업체코드 모양이 틀림(32자 영문 소문자 · 숫자가 아님) | 404 | `{message: '업체를 찾을 수 없습니다.', validation_errors: null}` |
| 영업중지된 업체 | 400 | `{message: '영업이 중지된 업체입니다.', validation_errors: null, suspend_comment: '<정지 사유>' \| null}` |

- 모양이 틀린 업체코드도 입력 오류(400)가 아니라 없는 업체(404)다 — 따로 가를 필요 없다.
- 영업중지 400 의 `suspend_comment` 는 실패 본문에 더 붙는 필드다(정지 계정 로그인 403 의 `block_comment` 와 같은 방식). 사유를 적지 않고 정지했으면 `null`.

## 화면 구성과 쓰는 API 의 변경
- 로그인 · 아이디 찾기 · 비밀번호 초기화 화면이 열리면 주소의 `[store_code]` 로 이 API 를 부른다.
  - 200: `store_name` 을 "○○ 업체 로그인" 처럼 보여 주고, 지금처럼 주소의 업체코드를 그 화면의 API(`POST /api/v1/admin-service/manager/login` · `/find-login-id` · `/password-reset`)의 `store_code` 로 넘긴다.
  - 404: "업체 로그인 주소를 확인해 주세요" 안내(로그인 칸을 보여 주지 않는다) — 업체 로그인 주소 안내 `/manager/login` 으로 보내도 된다.
  - 400: `message` 와 `suspend_comment`(있으면)를 보여 준다.
- 영업중지 업체도 **매니저 로그인 API 자체는 막히지 않는다** — 업체 관리자는 로그인해서 내 업체 화면(M7)에서 정지 사유를 본다. 이 API 가 400 을 줄 때 로그인 칸까지 막을지는 프론트가 정한다.
- 업체 로그인 주소 안내 `/manager/login` 의 업체코드 붙여 넣기 칸도, 이동 전에 이 API 로 있는 업체인지 확인할 수 있다(선택).

## 바뀐 DTO (Swagger 데코레이터를 뺀 사본 — contracts/store/dto/store-login-store.dto.ts)
```ts
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
```
