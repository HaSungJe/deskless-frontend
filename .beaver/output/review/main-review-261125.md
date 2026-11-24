# Review — main (여행 도우미 — AI 대화로 숙소 찾기 · 로드맵 밖) — 261125

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features:
  - 여행 도우미 — AI 대화로 숙소 찾기(백엔드 수정 요청 `frontend/changes/2026-11-25-chat-ai-search.md`) · spec `.beaver/output/spec/chat/chat-ai-search-spec.md` · plan `.beaver/output/plan/chat/chat-ai-search-plan.md` · report `.beaver/output/report/chat/chat-ai-search-report.md`
- Change scope:
  - 공통 — 스트림 함수 `src/shared/api/stream.ts`(`callStream` — 새 호출 방식)
  - 계약 — `src/contracts/chat/`(DTO 3 · `chat.constants.ts` · `api.ts` 4 — 대화 보기 · 남은 질문 수 · 질문 보내기(스트림) · 초기화(큐))
  - 이용자 — `src/app/(user)/chat/`(page · `ChatContent` · `ChatBubble` · `ChatStoreCard` · `chat-format.ts`), 경로 모달 `src/app/@modal/(.)chat/page.tsx` · `@modal/page.tsx`, 홈 "가까운 순" → "여행 도우미" 버튼, css 3 · 홈 css
  - 테스트 — 새 3파일(스트림 2 · 계산 12 · 화면 5) · 고친 1파일(홈 버튼 1), 문서 `AGENTS.md` · `docs/architecture.md` · `docs/data-layer.md`
- 검증: `npx next typegen && npx tsc --noEmit --noUnusedLocals` 오류 0(build 때 TS7018 2건 고침). 테스트는 build 규칙대로 아직 돌리지 않았다(ship 뒤 `/beaver:test`). `npm run lint` 는 사용자 몫. 백엔드 · 실제 화면은 미확인(k8s 게이트웨이 연결 안 됨 — 2026-11-25).

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `callStream` · `StreamEventType` · `StreamOptionsType` · `ChatContent` · `ChatBubble` · `ChatStoreCard` · `ChatBubbleType` · `ChatAnswerType` · `ChatCardType` · `ChatQuotaType` · `InlineType` · `AnswerBlockType` · `CHAT_STREAM_EVENT` · `CHAT_PHASE` · `CHAT_ROLE` · `CHAT_NAME` · `CHAT_PATH` · `EMPTY_ANSWER` · `ANSWER_FAILED_MESSAGE` · `applyChatEvent` · `finishAnswer` · `chatSendLock` · `quotaAfterFailure` · `answerBlocks` |
| Structure & layering | pass | HTTP 스트림 읽기는 도메인을 모르는 `shared/api/stream.ts`(이벤트 뜻은 contracts · 화면), 엔드포인트는 `contracts/chat/api.ts`, 화면 전용 계산은 `chat/chat-format.ts`, `app → contracts → shared` |
| 경로 모달 | pass | `@modal/(.)chat` + `RouteModal` + 같은 주소의 보통 페이지(`(user)/chat/page.tsx`), 화면 내용은 보통 페이지 폴더의 `ChatContent`, `@modal/page.tsx`(홈) 추가 — 문서의 미적용 줄을 적용으로 |
| 공통 로직 분리 | pass | SSE 자르기는 큐와 같이 `takeSseEvents`, 실패 모양은 `callQueue` 와 같다(시작 전 `ApiError` · 끊김 `NetworkError` · 취소 `AbortError`) |
| 공통 부품 | pass | `Button` · `buttonClass` · `Band` · `EmptyState` · `Field` · `Input` · `ConfirmModal` · `RouteModal`, 카드는 문의 업체 고르기 · 업체 상세 칩 값 |
| Errors & responses | pass | 시작 전 거절 → 429 는 막는 이유(오류 팝업 없이), 그 밖은 `handleApiError`(400 은 `Field name="content"` 칸 옆), 도중 실패 · 끊김 → 실패 말풍선, 떠남(AbortError)은 무시 |
| API 계약 | pass | `GET /user-service/chat` · `/chat/quota`(동기) · `POST /chat/message`(스트림 · `Accept: text/event-stream`) · `DELETE /chat`(큐) — 요청서 표와 같다, 로그인 필요 → `withAuth`(401 재시도는 스트림 시작 전이라 안전) |
| 검증 | pass | `ChatMessageDto` 사본 + `validateAction`, 칸 `maxLength 100` · 빈 값이면 버튼 꺼짐 |
| React Compiler 모양 | pass | try 안 await 만(스트림 콜백은 try 밖), 불리는 함수가 먼저(`updateBubble` → `send`), 효과는 `useEffectEvent` + `AbortController` |
| 본문 순서 · 주석 | pass | 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX, 오른쪽 주석, spec 흐름 번호 |
| 보안 | pass | AI 답 글은 React 요소로만(굵게 · 목록) — HTML 을 넣지 않아 `<b>` 같은 글자가 글자 그대로(테스트), 화면에 업체 ID 글자 없음(테스트) |
| 스타일 토큰 | pass | 색 · 크기는 `var(--…)` — 말풍선 `--primary-soft` · `--surface-2`, 칩 `--badge-h` |
| Test strength | pass | spec ✓ 6 + 계산 12 + 스트림 2 — 인자(DTO 종류 · 다듬은 질문 · 토큰 · 취소 신호 · 헤더 · 본문), 호출 횟수(보내기 · 초기화 1번 · 대화 2번 · 확인 전 0번 · 이벤트 0번), 받는 중 · 완료 중간 상태, 오류 팝업 0번, 로그인 주소 |

## Intended Behavior Check (against plan/spec)
- 지도 버튼: "가까운 순" 대신 "여행 도우미" — 로그인 `/chat/`, 로그인 전 `/login/?return_url=%2Fchat%2F` — spec 과 같다.
- 대화 보기: 대화 1번 · 말풍선 · 카드 · 남은 질문 수 · 첫 안내(예시 질문) · 못 읽음 다시 불러오기 · 다른 탭에서 돌아오면 남은 질문 수만(받는 중이면 건너뜀) — spec 과 같다.
- 질문 보내기: 내 말풍선 → 진행 → 카드 → 글 이어 붙임 → 완료(저장된 답 · 남은 수), 막는 이유 4가지, 시작 전 거절(말풍선 지움 · 429 막음 · 그 밖 질문 되돌림 + 받은 문구), 도중 실패 · 완료 없이 끝남 → 실패 말풍선, 떠나면 끊음 — spec 과 같다.
- 초기화: 확인 창 → 큐 → 대화 다시 읽기(done · pending 이 같은 null 이라 — plan 결정, spec 의 "비우기"와 같은 결과).
- plan 과 다른 점(report): 보통 화면 입력 줄 sticky, 타입 2건, `docs/conventions.md` 대신 `docs/architecture.md` 에 경로 모달 예시.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | 참고 | 백엔드 · 실제 화면 | k8s 게이트웨이(13000)에 연결이 안 돼 새 API · Gemini 답 · 스트림을 화면에서 보지 못했다 | 백엔드 배포 뒤 화면 확인 |
| 2 | 참고 | `src/app/css/user/ChatContent.module.css` `.chatInModal` | 팝업 안 대화창 높이 `min(70vh, 640px)` — 휴대폰 크기 · 키보드가 올라올 때는 화면에서 확인 필요 | 화면 확인 뒤 조정 |
| 3 | 참고 | `src/app/@modal/page.tsx` | 홈에서 슬롯을 비우는 효과는 코드상 추론(Next 경로 모달 동작) — 팝업 안에서 홈으로 가는 링크는 지금 없다 | 화면 확인 때 같이 |
| 4 | 참고 | 테스트 · `npm run lint` | build 규칙대로 테스트를 아직 돌리지 않았고, lint 는 사용자 몫 | ship 뒤 `/beaver:test`, lint 는 사용자 확인 |

## Verdict
Pass — no issues(참고 4건). 커밋은 하나로: 스트림 함수 · 계약 · 화면 · 경로 모달 · 홈 버튼 · 테스트 · 문서가 모두 여행 도우미 한 덩어리(스트림 함수는 이 기능에 포함 — 사용자 결정). 로드맵 해당 없음(17개 단계 모두 끝남).
