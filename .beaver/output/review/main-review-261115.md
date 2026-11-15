# Review — main (Phase 2 API 기반) — 261115

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 2 API 기반(#3 호출 클라이언트 · #4 공통 계약 · #5 표시 형식) + build 중 사용자 요청 axios 완전 제거 + 이전 대화의 "로컬 포트" 문서(`.env.example` · `docs/architecture.md` · `docs/data-layer.md` · `AGENTS.md`)
- Change scope: 코드 29파일(새 16 · 고침 10 · 삭제 2 · 옮김 2), `package.json` axios 제거, 문서 AGENTS.md · docs 6개 · beaver 기록
- 검증: `npx next typegen && npx tsc --noEmit` 통과, `npx vitest run` 9파일 49건 통과(처음 1건 실패 — 아래 #1 로 고침). `npm run lint` · `/dev/ui` 화면 확인은 사용자 실행 대상이라 아직.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `ApiError` · `ApiFailBodyType` · `RequestOptionsType` · `QueueOptionsType` · `SseEventType` · `LookupGroupType`, 상수 UPPER_SNAKE |
| Structure & layering | pass | `shared` → `contracts` · `app` import 없음(grep). 구조 규칙 — `Pagination` · 고친 `LoginContent` · `UiPreviewContent` `Gallery` 가 순서 · 빈 줄 · 영역 주석 · 오른쪽 주석 · JSX 덩어리 주석을 지킨다. 공통 부품은 `ui/nav/`, css 는 `shared/css/ui/nav/` |
| Shared logic extraction | pass | 주소 · 헤더 · 실패 본문은 `request.ts` 하나, `callQueue` 가 같이 쓴다. 쿠키 route handler 호출은 `callCookieRoute` 하나 |
| Errors & responses | pass (주의 #3) | 동기 · 큐 실패가 `ApiError(status, body)` 하나, `handleApiError` 가 칸 · alert. route handler 는 그대로 200 + `{success}` |
| Test strength | pass (사용자 결정 반영) | spec 34건 + 기존 1건. `format.ts` · `lookupName` 은 사용자 결정으로 TDD 생략, 바꾼 예전 코드(`cookie.ts` · access route · `LoginContent`)는 호출 방식만 바꾼 위임형 |

## Intended Behavior Check (against plan/spec)
- spec Business Rules — 주소(`/api/v1` + path + 빈 값 뺀 query) · 헤더 · 큐 결과(지침서 그대로) · 실패 본문 · 응답 없는 실패 고정 문구 · AbortError 무시 · 401 던지기만 · `Asia/Seoul` 고정 · 금액 · 요일 · 룩업 · 페이지 탭 모양 — 코드와 테스트가 맞다.
- 공통 계약 5개는 지침서 블록을 스크립트로 옮겨 글자까지 같다.
- axios 제거(사용자 요청): `cookie.ts` · access route · `LoginContent` 는 예전 동작(실패 → `null` · `false` · `{success: false}`, 같은 주소)을 그대로 지킨다. 인증서 검사를 끄던 `rejectUnauthorized: false` 는 fetch 에 없어 없앴다(로컬 http · 운영 정상 인증서 전제).
- 초안 규약(AGENTS.md ⚠️ · Conventions 표시 형식 · Data Layer · Error & Response, docs/data-layer.md · error-handling.md · testing.md)을 코드와 대조 — 맞지 않던 두 곳(#2 · #3)을 고치고 표시를 지워 확정했다.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | Medium | `src/shared/api/error.test.ts:61` | jsdom 은 한 번도 쓰지 않은 span 의 `innerText` 가 `undefined` 라 `toBe('')` 가 실패 | 고침 — "칸을 건드리지 않음"을 `style.display` 로 확인, docs/testing.md 에 적음 |
| 2 | Low | `src/shared/utils/format.ts:29` | `toKst` 는 오프셋 없는 문자열(`YYYY-MM-DD` 등)을 실행 환경 시간대로 읽어 서버(UTC)와 브라우저 결과가 다를 수 있다 | 고침(문서) — JSDoc · docs/data-layer.md 에 "Z · 오프셋 붙은 시각만, 날짜 · 달 · HH:mm 은 그대로" |
| 3 | Low | `src/shared/api/error.ts:20` | `ApiError` 가 아닌 오류는 모두 고정 문구 — 요청 성공 뒤 같은 `try` 안의 코드 오류도 "서버에 연결할 수 없습니다" 로 보인다(예전엔 조용히) | 기록 — docs/error-handling.md 주의. Phase 3 에서 `request` · `callQueue` 를 감쌀 때 fetch 실패를 `NetworkError` 로 나눈다 |
| 4 | Low | `src/shared/api/request.test.ts:53,64` | POST · 토큰 케이스에 fetch 호출 횟수 단언이 없다 | 고침 — `toHaveBeenCalledTimes(1)` |
| 5 | Low (미확인) | `src/shared/api/queue.ts:33` | 200 인데 본문이 SSE 가 아니면(프록시 JSON 등) 이벤트 없이 `null` — 화면은 다시 조회만 해서 원인이 가려진다 | 기록 — 지침서상 큐 API 는 항상 `text/event-stream`. 실제 백엔드에서 보이면 content-type 확인을 더한다 |
| 6 | Low | `src/app/(user)/login/LoginContent.tsx:63` | 예전 백엔드 로그인의 실패 키는 `validationErrors`(camelCase) — 서버 칸 오류가 칸 옆이 아니라 `alert(message)` 로 | 받아들임 — 화면 검증(`LoginDto`)이 먼저 막고, 화면은 Phase 5 에서 U5 로 바뀐다 |
| 7 | Low | `src/shared/api/sse.ts:20` · `request.ts:138` · `queue.ts:63` | `\r` 조각 경계 · 2xx 인데 JSON 아님 · `status_code` 없는 failed(→ 500) · `isReset=false` 는 테스트 없음(동작은 코드로 확인) | 기록 — spec 에서 합의한 케이스 밖. 그 코드를 고칠 때 더한다 |

## Verdict
Pass — #1 · #2 · #4 는 고쳤고(테스트 49건 · 타입 체크 통과), #3 · #5 · #6 · #7 은 Low 로 기록해 둔다. 커밋으로 진행.
