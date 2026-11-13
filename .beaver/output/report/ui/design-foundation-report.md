# Report — 디자인 기반 (Phase 1)

## Feature Summary
- **Feature**: 시안의 색 · 글꼴 · 크기를 전역 토큰으로, 공통 UI 부품과 경로 모달 규칙을 코드로
- **Entry point**: `PAGE /dev/ui · /dev/ui/modal-demo (개발 전용) · src/shared/components/ui/*`
- **Domain**: ui
- **Plan**: `.beaver/output/plan/ui/design-foundation-plan.md` · roadmap Phase 1 (#1 · #2) · direct 모드(`main`)

## Created/Modified/Deleted Files
| File | Change Type | Description |
|------|-----------|------|
| `src/app/globals.css` | created | 색 토큰 한 벌(콘솔 이름) + 이용자 전용 색, 크기 토큰(기본 이용자 · `[data-area="console"]`), 기본 스타일 |
| `src/app/layout.tsx` | modified | Noto Sans KR(`next/font/google`, `--font-noto-sans-kr`) · `globals.css` · `modal` 슬롯 prop |
| `src/app/RootLayoutContent.tsx` | modified | `modal` 을 Provider 안에서 그림 · 진행 막대 `var(--primary)` · 구조 규칙(영역 · 주석) |
| `src/app/@modal/default.tsx` | created | 슬롯 기본 null |
| `src/app/@modal/[...catchAll]/page.tsx` | created | 다른 주소로 가면 슬롯 비우기(null) |
| `src/app/@modal/(.)dev/ui/modal-demo/page.tsx` | created | 경로 모달 예시 — 가로채기(운영 null) |
| `src/app/dev/ui/page.tsx` | created | 미리보기(운영 404) |
| `src/app/dev/ui/modal-demo/page.tsx` | created | 경로 모달 예시 — 보통 페이지(운영 404) |
| `src/app/dev/ui/UiPreviewContent.tsx` · `.module.css` | created | 색 토큰 · 부품 전부를 이용자 / 콘솔 크기로 나란히, 오류 span · 모달 · 경로 모달 예시 |
| `src/app/dev/ui/modal-demo/ModalDemoContent.tsx` | created | 경로 모달 예시 내용 |
| `src/shared/components/ui/Button.tsx` · `.module.css` | created | variant · size · icon · full, `buttonClass()` |
| `src/shared/components/ui/Input.tsx` · `Textarea.tsx` · `Input.module.css` | created | 한 줄 · 여러 줄 입력, `invalid` |
| `src/shared/components/ui/Field.tsx` · `.module.css` | created | 라벨 · 입력 · 오류 span(`validation-alert`) · 도움말 |
| `src/shared/components/ui/Badge.tsx` · `Band.tsx` (+ css) | created | 상태 배지 6색, 안내 띠 3색 |
| `src/shared/components/ui/Switch.tsx` · `Chip.tsx` · `Segmented.tsx` · `Tabs.tsx` (+ css) | created | 스위치 · 칩 · 선택 버튼 묶음 · 탭(링크 / 버튼) |
| `src/shared/components/ui/Card.tsx` · `Table.tsx` · `EmptyState.tsx` (+ css) | created | 카드 · 표 틀 · 빈 상태 |
| `src/shared/components/ui/Modal.tsx` · `.module.css` | created | `<dialog>` + `showModal()`(없으면 open 속성), Esc → `onClose`, 열려 있을 때만 내용 |
| `src/shared/components/ui/ConfirmModal.tsx` · `ReasonModal.tsx` (+ css) | created | 확인 · 사유 입력(필수 · 공백 제거 · maxLength · busy) |
| `src/shared/components/ui/RouteModal.tsx` | created | 늘 열린 Modal, 닫기 `router.back()` |
| `src/shared/components/ui/CopyButton.tsx` | created | 클립보드 복사 · "복사됨" 2초 · 실패 alert |
| `src/shared/components/Loading.tsx` · `Loading.module.css` | modified / created | 초록 인라인 스타일 → CSS Module · `var(--primary)` · 구조 규칙 |
| `src/shared/utils/validation.ts` | modified | 오류 span 글자색 `'red'` → `var(--danger)` (`:38`) |
| `src/app/(user)/HomeContent.tsx` · `login/LoginContent.tsx` · `login/dto.ts` · `login/dto.test.ts` | moved | build 뒤 구조 변경 — `src/features/` 를 걷어내고 화면을 page.tsx 옆으로(내용 그대로) |
| `src/features/` | deleted | 위 이동으로 빈 폴더 삭제 |
| page 5곳 (`(user)/page.tsx` · `login/page.tsx` · `dev/ui/page.tsx` · `dev/ui/modal-demo/page.tsx` · `@modal/(.)dev/ui/modal-demo/page.tsx`) | modified | import 경로만 — 같은 폴더 `./<화면>Content`, 가로채기 page 는 `@/app/dev/ui/modal-demo/ModalDemoContent` |
| `eslint.config.mjs` | modified | 영역 규칙에서 features 를 빼 `app → contracts → shared` |
| `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md` · `docs/{testing,error-handling,data-layer}.md` | modified | 화면 위치를 page.tsx 옆(colocation) · `_components/` 로 바꾸고 근거 경로 갱신 |

## Tests Written
- `src/shared/components/ui/ReasonModal.test.tsx` — plan 의 4건 그대로
  - `[FAIL:validation]` 필수인데 비어 있거나 공백뿐이면 확인 비활성 · `onConfirm` 미호출
  - `[SUCCESS]` `"  고객 요청  "` → `onConfirm("고객 요청")` 1회
  - `[FAIL:validation]` `maxLength=5` · `"123456789"` → 칸 `"12345"`, `onConfirm("12345")` 1회
  - `[SUCCESS]` 필수 아님 · 빈 채 확인 → `onConfirm("")` 1회
- 테스트 생략(위임형): 토큰 · 나머지 부품 · `/dev/ui` — plan 대로 테스트 없음
- build 는 테스트를 실행하지 않는다 — 실행은 `/beaver:test`.

## Verification
- `npx next typegen && npx tsc --noEmit` 통과(오류 0) — 새 파일 41개 · 고친 파일 4개 모두 타입이 맞는다.
- 계층 방향: `shared` → `app`/`contracts` · `contracts` → `app` import 없음(grep 확인).
- 구조 변경(사용자 결정 2026-11-14): build 뒤 `src/features/` 를 걷어냈다 — 화면마다 app 경로를 1:1 로 따라가는 두 번째 트리일 뿐이라. plan 의 경로(`src/features/dev/ui/*`)도 새 위치로 고쳤고 `validate-plan.js` 통과.
- plan 대조: File List 의 파일이 모두 있고 코드는 plan 그대로(경로 변경 외) — 바뀐 곳 없음. 규약 초안(docs/conventions.md "스타일" · "컴포넌트 · 훅 안의 구조", docs/architecture.md "경로 모달", AGENTS.md)과 구현이 어긋나지 않아 초안은 그대로 둔다.
- memory 구조 규칙(`.beaver/memory/conventions.md`): 새 컴포넌트 · 고친 Loading · RootLayoutContent · layout 이 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX 순서, 영역 빈 줄 · 영역 주석 · 오른쪽 역할 주석 · JSX 덩어리 주석을 지킨다(읽어서 확인).

## Remaining Issues
- 테스트 미실행 — `/beaver:test`(또는 `npx vitest run`)로 확인한다.
- 화면 확인은 사용자가 `npm run dev` 후 `/dev/ui/` 에서 — 두 크기 · 오류 표시 · 확인 / 사유 입력 모달 · "경로 모달 열기"(팝업) · 그 주소 새로고침(보통 페이지)을 본다.
- `npm run lint`(import 방향 규칙 포함) · `npm run build` 는 사용자 실행 대상이라 돌리지 않았다.
- `next/font/google` 은 빌드할 때 글꼴을 내려받는다 — Docker 빌드에 네트워크가 필요하다(이미 `npm ci` 에도 필요).
- jsdom 에는 `showModal` 이 없어 테스트에서는 `open` 속성으로 연다(브라우저는 `showModal`).
- 페이지 버튼(`Pagination`) 모양은 Phase 2 #4 에서.
- 경로 모달 빈틈(코드상 추론 · 미확인): `[...catchAll]` 은 `/` 에 맞지 않아, 팝업 안 링크로 홈(`/`)에 가면 팝업이 남을 수 있다 — `src/app/@modal/page.tsx`(null) 추가로 막는다. 사용자 결정: 나중에.

## Modification - 261114-1
ship 리뷰(`.beaver/output/review/main-review-261114.md`) 반영 + 사용자 요청 구조 변경. 커밋 전이라 같은 ship 에 들어간다.

| File | Change Type | Description |
|------|-----------|------|
| `src/shared/components/ui/modal/Modal.tsx` | modified | 열고 닫기를 `useLayoutEffect` 로(빈 대화상자 한 프레임 방지), `<dialog>` `close` 이벤트로 브라우저가 스스로 닫은 것을 `onClose` 로 맞춤, 사라질 때 `close()` 로 포커스 되돌림 — 리뷰 #1 · #2 · #3 |
| `src/shared/components/ui/modal/RouteModal.tsx` | modified | `closingRef` — 닫기를 여러 번 눌러도 `router.back()` 한 번 — 리뷰 #2 |
| `src/shared/components/ui/modal/ReasonModal.tsx` | modified | `<Textarea maxLength>` 도 같이(한글 조합 보호) — 리뷰 #4 |
| `src/app/css/globals.css` | modified | 색 토큰 선택자에 `::backdrop` 추가(옛 브라우저 `--scrim`) — 리뷰 #6 |
| `src/app/layout.tsx` · `button/Button.tsx` · `(user)/page.tsx` · `(user)/login/page.tsx` · `display/Band.tsx` · `display/Table.tsx` | modified | 반환 타입 · `ButtonStyleType` · JSX 덩어리 주석 — 리뷰 #7 · #9 |
| `docs/conventions.md` "스타일" | modified | 부품 고유 치수 · 간격 · 글자 크기 예외, 빠진 토큰 이름 — 리뷰 #8 |
| `src/shared/components/ui/modal/ReasonModal.test.tsx` | modified | busy · 취소 · Esc · 브라우저 닫힘 · 닫힘/다시 열기 케이스 추가, props 순서, maxLength 케이스 `[SUCCESS]` — 리뷰 #5 |
| `src/shared/components/ui/modal/RouteModal.test.tsx` | created | 열린 채 그림 · 닫기 두 번 → `back` 1회 · Esc 두 번 → `back` 1회 |
| `src/shared/components/ui/<종류>/` | moved | 사용자 요청 — `button/` · `form/` · `display/` · `nav/` · `modal/` 로 나눔(내용 그대로, 다른 종류 import 만 별칭으로) |
| `src/app/css/` · `src/shared/css/` | moved | 사용자 결정 — css 를 css 폴더로: `app/css/globals.css` · `app/css/dev/UiPreviewContent.module.css`, 공통 부품은 `shared/css/` 아래 components 와 같은 경로(`ui/<종류>/` · `Loading.module.css`). shared 의 css 를 app 에 두지 않아 import 방향 규칙 유지 |
| `AGENTS.md` · `docs/architecture.md` · `docs/conventions.md` · 로드맵 | modified | 위 위치 · 종류 폴더 · css 규칙 반영 |

- 검증: `npx next typegen && npx tsc --noEmit` 통과, `npx vitest run` 4파일 18건 통과, css import 16곳 모두 실제 파일 확인.
- plan(`design-foundation-plan.md`)의 코드 블록은 처음 설계 그대로 둔다 — 지금 위치는 이 절과 docs 가 기준.
