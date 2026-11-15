---
feature_goal: "지침서 호출 방식(동기 JSON · 큐 SSE · 실패 본문)을 fetch 클라이언트로, 공통 계약 사본과 표시 형식 유틸을 코드로"
domain: "api"
roadmap_phase: 2
api_method: "MODULE"
api_path: "src/shared/api/{request,queue,sse,error}.ts · src/contracts/common/* · src/shared/utils/format.ts · src/shared/components/ui/nav/Pagination.tsx"
affected_data: []
---

## Feature Description
모든 화면이 백엔드를 부르는 기반 — 동기 조회는 `request`, 상태를 바꾸는 쓰기는 큐(SSE) `callQueue`, 실패는 `handleApiError` 하나로 칸 옆 · alert 에 보여 준다.
fetch 하나로 통일하고 axios 를 걷어낸다(패키지 제거). 지침서 공통 DTO · 상수를 `contracts/common` 에 그대로 옮기고, 페이지 타입 · 페이지 버튼을 snake_case 와 시안 모양으로 바꾼다.
한국 시각 · 금액 · 요일 표시 유틸과 상태 이름 룩업을 둔다. 영역별 토큰 · 401 재발급은 Phase 3.

## 진입점
- Method: MODULE (화면 · `contracts/<도메인>/api.ts` 가 부르는 함수) · 공통 컴포넌트
- Path:
  - `src/shared/api/request.ts` — `request<T>({method?, path, query?, body?, token?, signal?}): Promise<T | null>` · `ApiError` · `API_BASE_URL`
  - `src/shared/api/queue.ts` — `callQueue<T>({method, path, body?, token?, signal?}): Promise<T | null>`
  - `src/shared/api/sse.ts` — `takeSseEvents(buffer): {events, rest}`
  - `src/shared/api/error.ts` — `handleApiError(error, isReset = true): void` · `NETWORK_ERROR_MESSAGE`
  - `src/contracts/common/` — `pagination.dto.ts` · `fail-result.dto.ts` · `roles.ts` · `sse.ts` · `reservation.constants.ts`(지침서 사본) · `lookup.ts`(`LOOKUP` · `lookupName`)
  - `src/shared/utils/format.ts` — `toKst` · `todayKst` · `formatPrice` · `daysToBits` · `bitsToDays` · `formatDays`
  - `src/shared/components/ui/nav/Pagination.tsx`(`shared/components/Pagination.tsx` 에서 옮김 — 공통 부품 `ui/<종류>/` 규칙) · `src/shared/types/pagination.ts` — snake_case
- Request:
  - `path` 는 `/api/v1` 뒤(`/user-service/discovery/stores`), `query` 는 `GET` 의 query, `body` 는 JSON, `token` 은 `Authorization: Bearer`
- Response:
  - `request` — JSON 본문(빈 본문 · 204 는 `null`). 실패(2xx 아님)는 `ApiError(status, 실패 본문)` throw
  - `callQueue` — `done` 이면 data, `pending` · 결과 없이 끝나면 `null`, `failed` 면 `ApiError(status_code, data)`, 스트림 전 실패면 `ApiError(status, 본문)` throw
  - `handleApiError` — `validation_errors` 를 칸 옆에(맞는 칸이 없으면 `alert(message)`), 없으면 `alert(message)`, 응답이 없는 실패는 고정 문구 alert, 취소(AbortError)는 무시

## Business Rules
- 주소는 `${NEXT_PUBLIC_API_URL}/api/v1${path}${query}` — 게이트웨이 하나만(로컬 `http://localhost:3000`).
- 요청 · 응답 키는 snake_case 그대로. `GET` 은 query, 그 밖은 JSON 본문(`Content-Type: application/json`).
- query 는 `createQueryString` — `null` · `undefined` · 빈 문자열은 빼고 키 · 값을 `encodeURIComponent`.
- 큐는 `Accept: text/event-stream` 으로 `fetch` 스트림을 읽는다 — `accepted` 뒤 `done` · `failed` · `pending` 중 하나에서 끝난다. 이벤트 경계는 빈 줄(`\n\n`, CRLF 도 허용), 여러 줄 `data:` 는 `\n` 으로 잇고, `:` 로 시작하는 줄은 무시한다.
- 큐 결과는 지침서 예시 그대로 `done` → data, `pending` → `null` (사용자 결정). 응답 DTO 가 `null` 인 API 는 done 과 pending 이 같은 `null` — 화면은 `null` 이면 그 리소스를 다시 조회한다(둘 다 맞는 처리).
- 실패 본문은 동기 · 큐 같은 모양 `{message, validation_errors, …}` — 기능별 추가 필드(`block_comment` · `payment_error_code`)도 `ApiError.body` 에 그대로 남는다. JSON 이 아닌 실패 본문은 `{message: "서버 응답을 읽을 수 없습니다.", validation_errors: null}`.
- 응답이 없는 실패(네트워크 · 서버 꺼짐)는 `alert("서버에 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요.")` (사용자 결정). `AbortError` 는 화면이 스스로 취소한 것이라 보여 주지 않는다.
- 401 은 이번에는 `ApiError(401)` 로 던지기만 한다 — 영역별 토큰 재발급 · 로그인 화면 이동은 Phase 3 이 `request` · `callQueue` 를 감싸서 한다.
- 시각 표시는 dayjs `utc` · `timezone` 플러그인으로 `Asia/Seoul` 고정(사용자 결정) — 서버 렌더링(Docker UTC)에서도 같은 결과. 기본 형식 `YYYY-MM-DD HH:mm`, 빈 값은 `''`.
- 금액은 `12,000원`(원 단위 정수, 음수는 `-5,000원`). 요일은 0 일 ~ 6 토, `days_of_week` 는 비트합(`1 << 요일`, 매일 127) — `formatDays(127)` 은 `매일`, 그 밖은 `월 · 수 · 금` 처럼 일 → 토 순서.
- 상태 · 종류 이름은 응답의 `*_name` 을 먼저 쓰고, ID 만 올 때 `lookupName(구분, 값)` — 모르는 값은 값 그대로, 빈 값은 `''`.
- `shared` 는 `contracts` 를 가져올 수 없다 — 실패 본문 · 페이지 타입 · 큐 이벤트 이름은 `shared` 에 구조가 같은 타입 · 상수로 따로 두고, `contracts/common` 은 지침서 사본 그대로 둔다.
- 페이지 버튼은 시안(`frontend/design/manager.html` · `admin.html` `.pager`)대로 `‹ 번호 ›` — 처음 · 마지막 버튼은 없앤다. 현재 페이지는 `aria-current="page"` 이고 눌러도 이동하지 않는다. 1쪽이면 이전, 마지막 쪽이면 다음이 막힌다.

## TDD Cases
- [CASES:takeSseEvents] `"event: done\ndata: {\"id\":1}\n\n"` → 이벤트 `[{event: "done", data: "{\"id\":1}"}]`, rest `""`
- [CASES:takeSseEvents] `accepted` · `done` 두 이벤트가 한 버퍼에 → 두 개를 순서대로, rest `""`
- [CASES:takeSseEvents] `"event: accepted\ndata: {}\n\nevent: do"` → 이벤트 1개(accepted), rest `"event: do"`
- [CASES:takeSseEvents] CRLF `"event: done\r\ndata: null\r\n\r\n"` → `[{event: "done", data: "null"}]`
- [CASES:takeSseEvents] `data:` 두 줄 → data 를 `\n` 으로 이어 한 값
- [CASES:takeSseEvents] 주석만 `": ping\n\n"` → 이벤트 0개, rest `""`
- [CASES:takeSseEvents] data 없는 `"event: pending\n\n"` → `[{event: "pending", data: ""}]`
- [CASES:callQueue] accepted → done `{"store_id":1}` → `{store_id: 1}` · fetch 1회 · method · `Accept: text/event-stream` · `Content-Type: application/json` · `Authorization: Bearer t` · 본문 JSON
- [CASES:callQueue] done `null` → `null`
- [CASES:callQueue] failed `{status_code: 400, message, validation_errors}` → `ApiError`(status 400, body 그대로) throw
- [CASES:callQueue] pending `{request_id, message}` → `null`
- [CASES:callQueue] 한 이벤트가 두 조각으로 나뉘어 와도 → done data
- [CASES:callQueue] 스트림 전 401 JSON → `ApiError`(401) throw, 스트림을 읽지 않음
- [CASES:callQueue] done · failed · pending 없이 스트림이 끝남 → `null`
- [CASES:callQueue] token `null` → `Authorization` 헤더 없음
- [CASES:request] GET `query: {page: 1, keyword: undefined}` → `<API>/api/v1<path>?page=1`, 본문 없음, JSON 반환
- [CASES:request] POST `body: {login_id: "a"}` → `Content-Type: application/json`, 본문 `{"login_id":"a"}`
- [CASES:request] token `"t"` → `Authorization: Bearer t`
- [CASES:request] 400 실패 본문 → `ApiError`(400, 본문) throw
- [CASES:request] 204 · 빈 본문 → `null`
- [CASES:request] 502 HTML 본문 → `ApiError`(502, `{message: "서버 응답을 읽을 수 없습니다.", validation_errors: null}`)
- [CASES:createQueryString] `{page: 1, keyword: "강남 역"}` → `"?page=1&keyword=%EA%B0%95%EB%82%A8%20%EC%97%AD"`
- [CASES:createQueryString] `{page: 1, a: null, b: undefined, c: ""}` → `"?page=1"`
- [CASES:createQueryString] `{a: null}` · `{}` → `""`
- [CASES:Pagination] 4 버튼 → `movePage("4")` 1회
- [CASES:Pagination] 2쪽에서 이전 · 다음 → `movePage("1")` · `movePage("3")`
- [CASES:Pagination] 현재 페이지 버튼 → `movePage` 미호출
- [CASES:Pagination] 1쪽 → 이전 버튼 막힘, 눌러도 미호출
- [CASES:Pagination] 마지막 쪽 → 다음 버튼 막힘, 눌러도 미호출
- [FAIL:validation] `ApiError(400)` + `validation_errors` 칸 있음 → 그 칸에 메시지, `alert` 미호출, 이전 칸 오류는 지움
- [FAIL:validation] `validation_errors` 는 있는데 맞는 칸 없음 → `alert(message)` 1회
- [FAIL:validation] `validation_errors: null` → `alert(message)` 1회
- [FAIL:network] `ApiError` 가 아닌 오류(fetch `TypeError`) → 고정 문구 `alert` 1회
- [FAIL:abort] `AbortError` → `alert` 미호출
- 테스트 생략(사용자 결정 · 위임형): `format.ts` · `lookupName`(사용자가 TDD 제외) · `contracts/common` 사본(지침서 그대로) · `/dev/ui` 페이지 미리보기

## Notes
- 바꾸는 기존 코드:
  - `src/shared/api/axios.ts` — 호출처 0 → 삭제.
  - `src/shared/utils/util.ts:7-13` `createQueryString` — 빈 값 빼기(지금은 `undefined` 가 `"undefined"` 로 붙는다, 호출처 0).
  - `src/shared/types/pagination.ts:6-14` · `src/shared/components/Pagination.tsx` · `Pagination.test.tsx` → `src/shared/components/ui/nav/` 로 옮겨 camelCase → snake_case, 시안 모양, 구조 규칙 · CSS Module(`src/shared/css/ui/nav/Pagination.module.css`).
- axios 제거(사용자 요청 2026-11-15 — build 중): `src/shared/api/axios-error.ts` 삭제, `src/shared/api/cookie.ts` · `src/app/api/cookie/access/route.ts` · `src/app/(user)/login/LoginContent.tsx` 를 fetch(`request` · `handleApiError`)로, `package.json` 에서 axios 제거. 예전 로그인 화면 자체는 Phase 5 에서 U5 로 바꾼다.
- 형제 계약(§1.8): 실패 처리는 `axiosErrorHandle`(`src/shared/api/axios-error.ts:10-28`)과 같은 분담 — 칸 오류는 `resetValidationError` → `showValidationErrors`(`src/shared/utils/validation.ts:31,49`), 못 찾으면 `alert(message)`. 다른 점 두 가지(사용자 결정): 응답 없는 실패는 고정 문구 alert(예전엔 조용히), 동기 함수(`await` 없이).
- 문서: `docs/data-layer.md` "지침서 기준 (만들 것)" · "Pagination 응답 타입" TODO, `docs/error-handling.md` 지침서 TODO, `AGENTS.md` Data Layer · Error & Response · Checklist 의 `axiosErrorHandle` 줄을 새 코드로(초안 표시).
- 로컬 확인: 게이트웨이 `http://localhost:3000`, Swagger `/swagger` (docs/architecture.md "로컬 포트").

## Proposals (Codebase-Based)
- [x] `/dev/ui` 에 페이지 버튼 미리보기 — Phase 1 report 남은 문제 "페이지 버튼(`Pagination`) 모양은 Phase 2 #4 에서"(`.beaver/output/report/ui/design-foundation-report.md`)
- [x] 페이지 버튼 높이 32px 를 docs/conventions.md "스타일" 부품 고유 치수 예외에 더한다(시안 `.pager a{height:32px}`)

## Decisions
- [x] HTTP 클라이언트 — fetch 하나로 통일, axios 래퍼 삭제 (사용자 2026-11-15)
- [x] axios 완전 제거 — 남은 예전 코드(쿠키 route handler 부르기 · 재발급 · 예전 로그인)도 fetch 로 바꾸고 패키지 제거 (사용자 2026-11-15, build 중 요청)
- [x] 큐 결과 모양 — 지침서 예시 그대로 `done` → data, `pending` → `null` (사용자 2026-11-15)
- [x] 시각 표시 — dayjs `utc` · `timezone` 플러그인, `Asia/Seoul` 고정 (사용자 2026-11-15)
- [x] 응답 없는 실패 — 고정 문구 alert (사용자 2026-11-15)
- [x] TDD — 호출 클라이언트 · `createQueryString` · `Pagination` + 실패 처리 검증. 표시 형식 · 룩업은 생략 (사용자 2026-11-15)
- [x] `class-transformer` — 로드맵 #4 에 있지만 쓰는 곳(`plainToInstance` · `@Type`)이 이번에 없어 첫 입력 DTO 를 옮기는 Phase(5 · 로그인 · 가입)에서 넣는다 (기본값 — 쓰지 않는 의존성을 미리 넣지 않는다)
