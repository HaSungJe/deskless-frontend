# Report — 여행 도우미 — AI 대화로 숙소 찾기 (로드맵 밖)

## Feature Summary
- **Feature**: 여행 도우미 — AI 대화로 숙소 찾기
- **Entry point**: `PAGE /`(여행 도우미 버튼) · `PAGE /chat`(대화 보기 · 질문 보내기 · 초기화 — 지도에서 열면 경로 모달)
- **Domain**: chat
- **Plan**: `.beaver/output/plan/chat/chat-ai-search-plan.md` · spec `.beaver/output/spec/chat/chat-ai-search-spec.md` · 백엔드 수정 요청 `frontend/changes/2026-11-25-chat-ai-search.md` · direct 모드(`main`) · 로드맵 해당 없음

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/shared/api/stream.ts` | created | `callStream` — 이벤트가 여러 번 오는 SSE(시작 전 실패 `ApiError` · 끊김 `NetworkError` · 취소 `AbortError`, SSE 자르기는 `takeSseEvents`) |
| `src/contracts/chat/dto/chat-message.dto.ts` · `chat-detail.dto.ts` · `chat-quota.dto.ts` | created | 요청서 DTO 사본 |
| `src/contracts/chat/chat.constants.ts` · `api.ts` | created | 스트림 이벤트 · 진행 단계 · 말한 쪽 값, `getChat` · `getChatQuota` · `sendChatMessage`(스트림) · `resetChat`(큐) |
| `src/app/(user)/chat/chat-format.ts` | created | 이름 · 주소, `applyChatEvent` · `finishAnswer` · `chatSendLock` · `quotaAfterFailure` · `answerBlocks` · 말풍선 변환 |
| `src/app/(user)/chat/page.tsx` · `ChatContent.tsx` · `_components/ChatBubble.tsx` · `_components/ChatStoreCard.tsx` | created | 여행 도우미 화면(보통 페이지 · 팝업 공용) · 말풍선 · 업체 카드 |
| `src/app/@modal/(.)chat/page.tsx` · `src/app/@modal/page.tsx` | created | 지도 위 팝업(가로채기) · 홈에서 슬롯 비우기 |
| `src/app/(user)/HomeContent.tsx` · `src/app/css/user/HomeContent.module.css` | modified | "가까운 순" → "여행 도우미" 버튼(로그인 전이면 로그인 주소) |
| `src/app/css/user/ChatContent.module.css` · `ChatBubble.module.css` · `ChatStoreCard.module.css` | created | 대화 화면 스타일 |
| `src/test/shared/api/stream.test.ts` · `src/test/app/(user)/chat/chat-format.test.ts` · `ChatContent.test.tsx` | created | 스트림 2 · 계산 12 · 화면 5 |
| `src/test/app/(user)/HomeContent.test.tsx` | modified | 여행 도우미 버튼 1(로그인 · 로그인 전), `renderHome(isLogin)` |
| `AGENTS.md` · `docs/architecture.md` · `docs/data-layer.md` | modified | 스트림 `callStream` · 여행 도우미 · 첫 경로 모달(미적용 줄 → 적용) · 반영한 수정 요청 기록 |

plan 과 다른 점:
- `docs/conventions.md` 는 고치지 않았다 — 경로 모달 예시는 `docs/architecture.md` "경로 모달" 에 적었다(plan 의 "필요하면").
- 보통 화면에서 목록이 길면 화면이 스크롤되므로 입력 줄을 아래에 붙였다(`.chat .form` sticky) — plan css 목록에 없던 한 규칙.
- `bubblesOf` 의 화살표 함수에 돌려주는 타입(`ChatBubbleType`)을 붙였다 — 없으면 `progress: null` 이 암묵 any(TS7018). 스트림 테스트의 429 본문도 같은 이유로 `Record<string, unknown>`.
- 그 밖은 plan 코드 그대로.

## Tests Written
spec 의 ✓ 6건 + 계산 규칙 12건 = 18건(계산 규칙을 먼저 썼다) + plan 추가 스트림 함수 2건. build 에서는 실행하지 않았다.
- 계산 — 스트림으로 답 만들기 5: 진행 → `웹에서 찾고 있어요…` / 카드 2곳 · 글 빈칸 / 조각 두 개 이어 붙임 / 완료 → 저장된 글 · 카드 · 진행 없음 · 남은 2 / 실패 → 카드 없음 · 실패 문구 · 질문 수 없음
- 계산 — 막는 이유 4: 받는 중 / 다 씀(`11월 26일(목) 00:00`) / 다른 곳 답하는 중 / 막지 않음
- 계산 — 굵게 · 목록 3: 굵은 조각 / 문단 + 목록 / `<b>` 글자 그대로
- 대화 보기 1: 대화 1번 · 토큰 · 질문 말풍선 · 굵은 `해운대` · 카드(상세 링크 · 주소 · 칩 2개) · 남은 3회 · 첫 안내 없음 · 업체 ID 글자 없음
- 질문 보내기 1: 보내기 1번 · `ChatMessageDto` · 다듬은 질문 · 취소 신호 → 받는 중(내 말풍선 · 진행 문구 · "답을 받고 있어요." · 버튼 꺼짐) → 완료(진행 사라짐 · 굵게 · 카드 · 남은 2회 · 입력칸 비움 · 오류 팝업 0)
- 429 1: 막는 이유 문구 · 입력칸 · 버튼 꺼짐 · 내 말풍선 지움 · 남은 0회 · 오류 팝업 0
- 떠나면 끊음 1: 받는 중에 화면을 내리면 받은 신호가 `aborted`
- 초기화 1: 확인 전 0번 · 확인 창 문구 → 초기화 1번 · 토큰 · 대화 2번 읽기 · 말풍선 없음 · 첫 안내 · 남은 3회 · 확인 창 닫힘
- 지도 버튼 1: 로그인 → `/chat/`, 로그인 전 → `/login/?return_url=%2Fchat%2F`, "가까운 순" 없음
- 스트림 함수 2(`stream.test.ts`): 조각이 나뉘어도 이벤트 4개 순서대로 · 요청 1번 · 헤더 · 본문 / 시작 전 429 → `ApiError(429)` · 본문 `resets_at` 그대로 · 이벤트 0번

## Verification
- `npx next typegen && npx tsc --noEmit --noUnusedLocals`: 처음 TS7018 2건(위 "plan 과 다른 점") → 고쳐 오류 0.
- 테스트는 실행하지 않았다(build 규칙 — 실행은 ship 뒤 `/beaver:test`).
- 읽어서 확인: try 안은 `await` 만(스트림 콜백은 try 밖에서 만든다), 불리는 함수가 먼저(`updateBubble` → `send`). 시작 전 거절 · 도중 실패 · 끊김 · 완료 없이 끝남 · 떠남(AbortError)이 각각 spec 대로 갈린다. 초기화는 결과가 done · pending 모두 null 이라 대화를 다시 읽어 맞춘다(plan 결정). 답 글은 React 요소로만 그려 HTML 을 넣지 않는다.
- 경로 모달: 업체 카드 → 업체 상세는 `[...catchAll]`, 홈은 `@modal/page.tsx` 가 슬롯을 비운다(코드상 — 화면 미확인).

## Remaining Issues
- 테스트 실행 전 — ship 뒤 `/beaver:test`.
- 실제 화면 · 백엔드 연결 미확인 — 2026-11-25 k8s 게이트웨이(13000)에 연결이 안 됐다. 백엔드 배포 뒤 Gemini 답 · 스트림 · 하루 5회 한도를 화면에서 확인.
- 팝업 안 대화창 높이(`min(70vh, 640px)`)는 실제 휴대폰 크기에서 확인이 필요하다.
