# Report — API 기반 (Phase 2)

## Feature Summary
- **Feature**: 지침서 호출 방식(동기 JSON · 큐 SSE · 실패 본문)을 fetch 클라이언트로, 공통 계약 사본과 표시 형식 유틸을 코드로
- **Entry point**: `MODULE src/shared/api/{request,queue,sse,error}.ts · src/contracts/common/* · src/shared/utils/format.ts · src/shared/components/ui/nav/Pagination.tsx`
- **Domain**: api
- **Plan**: `.beaver/output/plan/api/api-foundation-plan.md` · roadmap Phase 2 (#3 · #4 · #5) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/shared/api/request.ts` | created | `request` · `ApiError` · `API_BASE_URL` · `buildUrl` · `buildHeaders` · `parseJson` · `toFailBody` · `UNREADABLE_FAIL_MESSAGE` |
| `src/shared/api/sse.ts` | created | `takeSseEvents` — 빈 줄 경계 · CRLF · 여러 줄 data · 주석 줄, 끝 `\r` 은 꼬리에 |
| `src/shared/api/queue.ts` | created | `callQueue` — done → data, pending · 끝남 → null, failed → `ApiError(status_code)`, 스트림 전 실패 → `ApiError(status)`, 끝나면 `reader.cancel()` |
| `src/shared/api/error.ts` | created | `handleApiError` · `NETWORK_ERROR_MESSAGE` — 칸 옆 / alert / 고정 문구 / 취소 무시 |
| `src/shared/api/axios.ts` | deleted | 호출처 0 — fetch 로 통일 |
| `src/shared/utils/util.ts` | modified | `createQueryString` — null · undefined · 빈 문자열 빼기 |
| `src/shared/utils/format.ts` | created | `toKst` · `todayKst` · `formatPrice` · `daysToBits` · `bitsToDays` · `formatDays` (dayjs utc · timezone, `Asia/Seoul`) |
| `src/contracts/common/pagination.dto.ts` · `fail-result.dto.ts` · `roles.ts` · `sse.ts` · `reservation.constants.ts` | created | `frontend/dto/common.md` 코드 블록을 스크립트로 그대로 옮김 |
| `src/contracts/common/lookup.ts` | created | `LOOKUP`(응답 필드 16개) · `lookupName` |
| `src/shared/types/pagination.ts` | modified | camelCase → snake_case (`PaginationResultDto` 와 같은 구조) |
| `src/shared/components/Pagination.tsx` → `src/shared/components/ui/nav/Pagination.tsx` | moved · rewritten | 시안 `‹ 번호 ›` · `aria-current` · 양 끝 막힘 · 처음/마지막 버튼 없앰 · 구조 규칙 · `label` prop |
| `src/shared/css/ui/nav/Pagination.module.css` | created | 시안 `.pager a` — 32px · 토큰 |
| `src/app/dev/ui/UiPreviewContent.tsx` | modified | "페이지 탭" 미리보기(상태 `page` · 계산 값 `pagination` · `previewPagination`) |
| `vitest.setup.ts` | modified | **plan 밖** — jsdom 에 없는 `CSS.escape` 간단 대체(오류 칸 선택자 `validation.ts:17` 이 씀). `error.test.ts` 에 필요 |
| `AGENTS.md` · `docs/data-layer.md` · `docs/error-handling.md` · `docs/architecture.md` · `docs/conventions.md` · `docs/testing.md` | modified | 새 호출 방식 · 실패 처리 · 공통 계약 · 형식 유틸 · 페이지 탭 · 테스트 환경 — 초안 표시(ship 에서 확정). `axios.ts` 를 가리키던 근거(`MAX_RELOAD` · JSDoc · catch)를 새 파일로 |

## Tests Written
- `src/shared/api/sse.test.ts`(node) — `[CASES:takeSseEvents]` 7건
- `src/shared/api/queue.test.ts`(node) — `[CASES:callQueue]` 8건: fetch 1회 · 주소 · method · 헤더 · 본문, done null, failed → `ApiError(400, body)`, pending, 조각난 이벤트, 스트림 전 401, 결과 없이 끝남, 토큰 없음
- `src/shared/api/request.test.ts`(node) — `[CASES:request]` 6건: GET query(빈 값 빠짐) · POST 본문 · 토큰 · 400 · 204/빈 본문 · 502 HTML
- `src/shared/api/error.test.ts`(jsdom) — `[FAIL:validation]` 3 · `[FAIL:network]` · `[FAIL:abort]`: 칸 표시 + 이전 칸 지움 + alert 미호출, 맞는 칸 없음 → alert 1회, null → alert 1회, TypeError → 고정 문구 1회(+ console.error), AbortError → 미호출
- `src/shared/utils/util.test.ts` — `[CASES:createQueryString]` 3건
- `src/shared/components/ui/nav/Pagination.test.tsx` — `[CASES:Pagination]` 5건 + 기존 `[FAIL:empty]` 1건 유지
- 테스트 생략(사용자 결정 · 위임형): `format.ts` · `lookupName` · `contracts/common` 사본 · `/dev/ui` 미리보기
- build 는 테스트를 실행하지 않는다 — 실행은 `/beaver:test`.

## Verification
- `npx next typegen && npx tsc --noEmit` 통과. 처음 돌렸을 때 `noImplicitAny`(이 프로젝트는 `strictNullChecks: false` 라 `null` 리터럴이 `any` 로 넓어진다) 오류 4건 — 테스트 값에 타입을 붙이고 `queue.ts` 의 `.catch((): void => undefined)` 로 고쳐 통과(plan 의 같은 줄도 맞춤).
- 계층 방향: `src/shared` · `src/contracts` 에서 `@/app` · `@/contracts`(shared) import 없음(grep). `shared` 는 실패 본문 · 페이지 타입 · 큐 이벤트 이름을 구조가 같은 타입 · 상수로 따로 둔다.
- 남은 참조: `axiosGet` · `shared/api/axios'` · `components/Pagination'` — `src` · docs · AGENTS.md 에 없음.
- plan 대조: File List 의 파일이 모두 있고 코드는 plan 그대로(`queue.ts` 의 `.catch` 타입 표기만 다름). 공통 계약 5개는 지침서 블록을 스크립트로 옮겨 글자까지 같다.
- 구조 규칙: `Pagination`(변수 > 함수 > JSX · 영역 주석 · 오른쪽 주석 · JSX 덩어리 주석), `UiPreviewContent` 의 `Gallery`(상태에 `page`, 새 계산 값 영역) — 읽어서 확인.

## Remaining Issues
- 테스트 미실행 — `/beaver:test` 에서. 특히 node 환경의 `ReadableStream` · `TextDecoder` 스트림 읽기와 `vitest.setup.ts` 의 `CSS.escape` 대체가 처음 돈다.
- 화면 확인은 사용자가 `npm run dev` 후 `/dev/ui/` — 두 크기의 "페이지 탭"(누르면 번호 이동, 1쪽 · 5쪽에서 양 끝 막힘).
- `npm run lint` 는 사용자 실행 대상이라 돌리지 않았다.
- 실제 백엔드(게이트웨이 `http://localhost:3000`)와 맞는지는 아직 부르는 화면이 없어 확인하지 못했다 — 첫 화면(Phase 3 · 5)에서 Swagger(`/swagger`)와 함께.
- 401 재발급 · 영역별 토큰은 Phase 3. 지금은 `ApiError(401)` → `alert(message)`.
- `class-transformer` 는 Phase 5(첫 입력 DTO)에서 — 로드맵 #4 에서 미룸.
- ~~axios 는 예전 코드에만 남음~~ → Modification 261115-1 에서 모두 걷어냄.
- 같은 작업 트리에 이전 대화의 "로컬 포트" 문서 변경(`.env.example` · `docs/architecture.md` · `docs/data-layer.md` · `AGENTS.md`)이 커밋 전으로 함께 있다 — ship 에서 같이 커밋된다.

## Modification - 261115-1
사용자 요청(build 중) — axios 를 완전히 걷어낸다. 위 "Remaining Issues" 의 axios 항목(Phase 3 · 5 로 미뤘던 것)은 이것으로 끝났다.

| File | Change Type | Description |
|------|-----------|------|
| `src/shared/api/cookie.ts` | modified | axios → fetch — `callCookieRoute(url, method, body)` 하나로 모으고, 실패(네트워크 · 2xx 아님 · JSON 아님)는 그대로 `null` · `false` |
| `src/app/api/cookie/access/route.ts` | modified | 재발급 `axios.post` → `fetch` — 2xx 아님 · JSON 아님은 상태 · 본문을 남기고 `{success: false}`. `https.Agent({rejectUnauthorized: false})`(인증서 검사 끔)는 fetch 에 없어 없앴다 |
| `src/app/(user)/login/LoginContent.tsx` | modified | `axios.post` → `request({method: 'POST', path: '/user/login'})`, `axiosErrorHandle` → `handleApiError`, 응답 타입 `LoginResultType`. 고치는 파일이라 구조 규칙(변수 > 상태 > 효과 > 함수 > JSX · 주석) 적용 — 동작은 그대로 |
| `src/shared/api/axios-error.ts` | deleted | 호출처가 없어짐 |
| `package.json` · `package-lock.json` | modified | `npm uninstall axios` |
| `AGENTS.md` · `docs/*` · spec · plan · 로드맵 | modified | axios 언급 정리, `LoginContent.tsx` · `access/route.ts` · `cookie.ts` 줄 번호 근거를 새 줄로 |

- 검증: `npx next typegen && npx tsc --noEmit` 통과. `src` 에 `axios` 문자열 0, `package.json` 에 axios 없음.
- 테스트는 쓰지 않았다 — 바꾼 셋은 예전 코드의 호출 방식만 바꾼 것(위임형)이고 plan 의 테스트 대상이 아니다. 실제 확인은 사용자가 `npm run dev` 로 — 로그인 상태 확인(주소를 바꿀 때마다 `/api/cookie/access`)이 그대로 도는지.
- 예전 백엔드 로그인(`/api/v1/user/login` · `/api/v1/user/refresh`)은 새 백엔드에 없을 수 있다 — 로그인 화면은 Phase 5, 재발급은 Phase 3 에서 지침서대로 바꾼다.
