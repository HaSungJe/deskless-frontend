# Review — main (Phase 1 디자인 기반) — 261114-2

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: 첫 리뷰(`main-review-261114.md`) 범위 + 그 지적 반영 + 사용자 요청 구조 변경(ui 종류 폴더 · css 폴더)
- Change scope: report `## Modification - 261114-1` 표 그대로
- 검증: `npx next typegen && npx tsc --noEmit` 통과, `npx vitest run` 4파일 18건 통과(ReasonModal 9 · RouteModal 3 · Pagination · dto), css import 16곳 실제 파일 확인. `npm run lint` · `/dev/ui` 화면 확인은 사용자 실행 대상이라 아직.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `ButtonStyleType` 로 고침 |
| Structure & layering | pass | `shared` 의 css 는 `shared/css/` — shared → app import 없음. 종류 폴더 사이 import 는 별칭, 같은 폴더는 `./`. memory 구조 규칙: 고친 Modal(모듈 함수 `openDialog` · `closeDialog` 를 밖으로, 본문은 변수 > 효과 > 함수 > JSX) · RouteModal(변수 오른쪽 주석) · page 2곳 · Band · Table JSX 주석 |
| Shared logic extraction | pass | 변화 없음 |
| Errors & responses | pass | 변화 없음 |
| Test strength | pass | ReasonModal: 막힘(빈 사유 · busy) 뒤 `onConfirm` 미호출, 취소 · Esc 는 `onClose` 1회 + `onConfirm` 미호출 + 기본 동작 막힘, 닫힘 → 안 그림, 다시 열기 → 빈 칸. RouteModal: `back` 호출 횟수 |

## Intended Behavior Check (against plan/spec)
- 첫 리뷰 #1~#9 반영 확인(위 report 표). 동작 의도(열 때만 내용 · 다시 열면 비움 · 필수 사유 · 공백 제거 · maxLength · busy)는 그대로.
- 위치 변경(ui 종류 폴더 · css 폴더)은 사용자 결정으로 문서(AGENTS.md · docs/conventions.md "스타일" · docs/architecture.md 트리)와 코드가 같다.

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | Low | `src/shared/components/ui/form/Field.tsx` | 오류 · 도움말 `aria-describedby` 연결 없음(첫 리뷰 #10) | Phase 5 로그인 화면에서 |
| 2 | Low | `src/app/@modal/` | `/` 용 `page.tsx`(null) 없음(첫 리뷰 #11) | 사용자 결정: 나중에 — docs/architecture.md "경로 모달" 미적용 항목 |
| 3 | Low | `src/shared/components/ui/` | `Modal` 외 부품 테스트 없음(첫 리뷰 #12) | 그 부품을 고칠 때 |
| 4 | Low | `src/shared/components/ui/modal/Modal.tsx` | `<dialog>` 동작 변경(useLayoutEffect · close 동기화)은 jsdom 에서만 확인 — 실제 브라우저 확인 전 | 사용자가 `/dev/ui` 에서 모달 열고 닫기 · Esc · 경로 모달 닫기 확인 |

## Verdict
Pass — 남은 4건은 모두 Low 이고 기록해 두었다. 커밋으로 진행.
