# Review — main (Phase 1 디자인 기반) — 261114

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 1 디자인 기반(#1 토큰 · #2 공통 UI · 경로 모달 · `/dev/ui`), build 뒤 구조 변경(`src/features/` 제거 → 화면을 page.tsx 옆으로)
- Change scope: 코드 — 새 파일 41개 · 고친 파일 9개 · 옮긴 파일 4개, 문서 — AGENTS.md · docs 6개 · beaver 기록(spec · plan · report · roadmap · memory)
- 검증: `npx next typegen && npx tsc --noEmit` 통과, `npx vitest run` 3파일 10건 통과. `npm run lint` · `/dev/ui` 화면 확인은 사용자 실행 대상이라 아직.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | violation(Low) | `ButtonStyle` 에 `Type` 접미사 없음 (`src/shared/components/ui/Button.tsx:4`) |
| Structure & layering | pass | `shared` 가 `app` · `contracts` 를 가져오지 않음, `@/features` 참조 0, 옮긴 파일은 내용 그대로. memory 구조 규칙(영역 순서 · 빈 줄 · 영역 주석 · 오른쪽 주석)은 새 컴포넌트 전부 지킴 — JSX 덩어리 주석만 몇 곳 빠짐(#9) |
| Shared logic extraction | pass | 공통 부품은 `shared/components/ui/`, 화면 전용은 화면 폴더 |
| Errors & responses | pass | 이번 변경에 API 호출 없음. 오류 span 은 `Field` 가 그림 |
| Test strength | violation(Medium) | `ReasonModal.test.tsx` 에 취소 · Esc · busy · 닫힘/다시 열기 케이스 없음(#5) |

## Intended Behavior Check (against plan/spec)
- 토큰(색 한 벌 · 영역별 크기) · 부품 18개 · 경로 모달 슬롯 · `/dev/ui` — plan 의 파일 전부 있고 동작 의도와 맞다.
- 초안 규약: "경로 모달"(docs/architecture.md) 은 코드와 맞음. "스타일"(docs/conventions.md) 토큰 목록에 `--primary-halo` · `--frame-shadow` · `--mono` 가 빠져 있어 채웠다. "높이 px 직접 금지" 문장은 시안 고정 치수(#8)와 어긋난다.
- memory 구조 규칙: docs/conventions.md "컴포넌트 · 훅 안의 구조" 에 조항 전부(순서 · 영역 정의 · 빈 줄 · 영역 주석 · 오른쪽 주석 · JSX 주석 · 훅 예외 · 적용 범위) 옮겨져 있음 — 정식 반영 후 보관 대상.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | Medium | `src/shared/components/ui/Modal.tsx:26` | `<dialog>` 열고 닫기를 `useEffect` 로 맞춘다 — `await` 뒤에 닫히면(큐 API `busy` 흐름) 효과가 그린 뒤에 돌아 빈 대화상자가 한 프레임 보일 수 있다(브라우저 미확인) | `useLayoutEffect` 로 |
| 2 | Medium | `Modal.tsx:56` · `RouteModal.tsx:24` | `<dialog>` 의 `close` 이벤트를 받지 않아, 브라우저가 스스로 닫으면(Chrome close-watcher: 취소 막은 뒤 두 번째 Esc) `open` 과 실제 상태가 어긋난다. × 를 빠르게 두 번 누르면 `router.back()` 이 두 번 불릴 수 있다 | `onClose` 이벤트에서 `open` 이면 `onClose()`, `RouteModal` 은 한 번만 닫기 |
| 3 | Low | `Modal.tsx:26` | `RouteModal` 이 사라질 때 `close()` 없이 빠져 포커스가 연 링크로 돌아가지 않는다 | 효과 정리 함수에서 `close()` |
| 4 | Low | `src/shared/components/ui/ReasonModal.tsx:61` | 길이 제한을 `slice` 로만 해, 한글 조합 중 한도에서 글자가 깨질 수 있다(미확인) | `<Textarea maxLength>` 도 같이 |
| 5 | Medium | `src/shared/components/ui/ReasonModal.test.tsx` | 취소 · Esc → `onClose` 1회 · `onConfirm` 미호출, `busy` 면 확인 막힘, 닫히면 안 그리고 다시 열면 비어 있음 — 케이스 없음. `:10` `{...props}` 가 mock 뒤에 있어 넘긴 `onConfirm` 이 반환값과 어긋남. `:41` maxLength 케이스는 성공 흐름인데 `[FAIL:validation]` | 케이스 추가 · props 순서 · 이름 `[SUCCESS]` |
| 6 | Low | `src/shared/components/ui/Modal.module.css:12` | `::backdrop` 이 `:root` 변수를 못 받는 브라우저(Safari < 17.4 · Chrome < 122)에서 어둡게 깔리지 않는다 | `globals.css` 에서 `::backdrop` 에도 `--scrim` |
| 7 | Low | `src/app/layout.tsx:56` | 고친 파일인데 `RootLayout` 반환 타입 `React.ReactNode` 없음 | 붙인다 |
| 8 | Low | `Tabs.module.css:11` · `Switch.module.css:13` · `Modal.module.css:34` · `Segmented.module.css:14` | 탭 44px · 스위치 · 닫기 버튼 · 6px 모서리를 값으로 씀 — 시안 고정 치수(manager.html `.tabs a{height:44px}`)라 영역 토큰 대상은 아니지만 "높이 px 직접 금지" 문장과 어긋남 | 문서에 "부품 고유 치수는 시안 값 그대로" 예외를 적는다 |
| 9 | Low | `src/app/(user)/page.tsx:5` · `src/app/(user)/login/page.tsx:4` · `Band.tsx:22` · `Table.tsx:18` | 고친 · 새 파일인데 JSX 덩어리 주석 빠짐 | 주석 추가 |
| 10 | Low | `src/shared/components/ui/Field.tsx:30` | 오류 · 도움말이 입력 칸과 `aria-describedby` 로 이어지지 않음 | 첫 입력 화면(Phase 5 로그인)에서 |
| 11 | Low | `src/app/@modal/` | `/` 에 맞는 `page.tsx`(null) 없음 | 사용자 결정: 나중에 — docs/architecture.md "경로 모달" 에 미적용으로 기록됨 |
| 12 | Low | `src/shared/components/ui/` | `RouteModal` · `Modal` · `ConfirmModal` · `CopyButton` · `Segmented` 테스트 없음(plan 은 `ReasonModal` 만) | 나중에 — 그 부품을 고칠 때 |

## Verdict
Changes needed(권장) — #1~#9 를 커밋 전에 고치고 다시 확인한 뒤 ship. #10~#12 는 기록만 하고 다음으로. 사용자 결정 대기.
