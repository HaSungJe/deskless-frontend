---
feature_goal: "시안의 색 · 글꼴 · 크기를 전역 토큰으로, 공통 UI 부품과 경로 모달 규칙을 코드로"
domain: "ui"
roadmap_phase: 1
api_method: "PAGE"
api_path: "/dev/ui · /dev/ui/modal-demo (개발 전용) · src/shared/components/ui/*"
affected_data: []
---

## Feature Description
25개 화면이 같이 쓰는 디자인 기반 — 시안의 색 · 글꼴 · 크기 토큰과 공통 UI 부품, 경로 모달 규칙을 만든다.
색은 전역 한 벌, 크기만 영역별(`data-area="console"`)이라 같은 부품을 이용자 · 콘솔이 같이 쓴다.
개발 전용 `/dev/ui` 에서 모든 부품을 두 크기로 나란히 확인한다(운영 404).

## 진입점
- Method: PAGE (개발 전용) · 공통 컴포넌트
- Path:
  - `/dev/ui` — 부품 미리보기(이용자 크기 · 콘솔 크기 나란히)
  - `/dev/ui/modal-demo` — 경로 모달 예시(미리보기에서 누르면 팝업, 직접 열면 보통 페이지)
  - `src/app/globals.css` — 색 · 크기 토큰
  - `src/shared/components/ui/` — `Button` · `Input` · `Textarea` · `Field` · `Badge` · `Band` · `Switch` · `Chip` · `Segmented` · `Tabs` · `Card` · `Table` · `Modal` · `ConfirmModal` · `ReasonModal` · `RouteModal` · `EmptyState` · `CopyButton`
  - `src/app/@modal/` — 루트 경로 모달 슬롯(`default.tsx` · `[...catchAll]`)
- Request: 부품 props(variant · size · tone · value · onChange · open · onClose · onConfirm …)
- Response: 화면에 그려지는 부품. `ReasonModal` 은 확인 시 `onConfirm(사유)`, `RouteModal` 은 닫을 때 `router.back()`

## Business Rules
- 색 토큰은 전역 한 벌, 이름은 콘솔 시안 기준(`--ok` · `--danger` · `--neutral-bg` …). 이용자 전용 색(`--map-*` · `--kakao` · `--naver`)만 더한다. 값은 세 시안과 같다(밝은 화면 한 벌).
- 크기 토큰(기본 글자 · 컨트롤 높이 · 버튼 굵기 · 입력 여백 · 배지 높이)은 기본이 이용자(15px · 48px), `[data-area="console"]` 이 콘솔(14px · 40px). 영역 layout 이 `data-area` 를 붙인다.
- 글꼴은 Noto Sans KR(400 · 500 · 700)을 `next/font/google` 로 — `--font` 가 그 변수를 쓴다.
- 부품 스타일은 같은 폴더 `<Name>.module.css`, 색 · 크기는 토큰 `var(--…)` 만 쓴다(값을 직접 쓰지 않는다).
- 모달은 브라우저 `<dialog>`(`showModal()`) — Esc · 바깥 막기 · 포커스는 브라우저 기본. 닫힘은 `onClose` 하나로 모은다.
- 사유 입력 모달: 필수면 비어 있거나 공백뿐일 때 확인을 막고, 확인하면 앞뒤 공백을 뺀 사유를 넘긴다. `maxLength` 를 넘는 입력은 잘라서 받고 글자 수를 보여 준다.
- 경로 모달: 슬롯은 루트 하나(`src/app/@modal`). 가로채는 팝업은 `src/app/@modal/(.)<주소>/page.tsx` 에서 `<RouteModal>` 로 감싸고, 같은 주소의 보통 페이지가 새로고침 · 직접 접속을 맡는다. 닫기는 `router.back()`, 다른 주소로 가면 `[...catchAll]`(null)이 팝업을 지운다.
- 입력 칸 오류는 기존 규칙 그대로 `<span data-type="validation-alert" data-id="<필드>">` — `Field` 가 그 span 을 그린다.
- `/dev/ui` 와 예시는 `NODE_ENV=production` 이면 404.

## TDD Cases
- [FAIL:validation] ReasonModal(필수) — 사유가 비어 있거나 공백뿐이면 확인 버튼이 비활성이고, 눌러도 `onConfirm` 이 불리지 않는다
- [SUCCESS] ReasonModal — `"  고객 요청  "` 입력 후 확인 → `onConfirm("고객 요청")` 1회
- [FAIL:validation] ReasonModal(`maxLength=5`) — `"123456789"` 입력 → 칸에는 `"12345"`, 확인 → `onConfirm("12345")` 1회
- [SUCCESS] ReasonModal(필수 아님) — 비운 채 확인 → `onConfirm("")` 1회
- 테스트 생략(위임형): 토큰 · Button · Input · Textarea · Field · Badge · Band · Switch · Chip · Segmented · Tabs · Card · Table · Modal · ConfirmModal · RouteModal · EmptyState · CopyButton · `/dev/ui` — 그리기와 이벤트 전달만, 실제 모습은 `/dev/ui` 로 본다

## Notes
- 시안: `frontend/design/manager.html`(디자인 기준 · 콘솔 부품), `frontend/design/user.html`(이용자 크기 · 안내 띠 · 칩), `frontend/design/admin.html`(색 이름 `--bad` 등 — 같은 값).
- 기존 부품 규칙을 따른다: default export · `type <Name>Props` · 반환 `React.ReactNode` (`src/shared/components/KakaoMap.tsx:10,47`, `src/shared/components/AuthGuard.tsx:19`).
- 오류 span 은 `src/shared/utils/validation.ts:31-44` 가 채운다.
- 페이지 버튼(`Pagination`) 모양은 Phase 2(#4, snake_case 전환)에서 같은 파일을 고칠 때 맞춘다.

## Proposals (Codebase-Based)
- [x] `Loading` 의 초록 스피너(`#15B06F`, 인라인 style — `src/shared/components/Loading.tsx:19-33`)를 `--primary` · CSS Module 로 — 시안에 없는 색
- [x] 상단 진행 막대(`NextTopLoader` — `src/app/RootLayoutContent.tsx:38`) 색을 `--primary`(`#2457D6`)로
- [x] 오류 span 글자색을 `validation.ts:38` 의 `'red'` 대신 `var(--danger)` 로 — 시안 오류색과 맞춘다

## Decisions
- [x] 토큰 구조 — 색 한 벌(콘솔 이름) + 크기만 영역별 `data-area` (선택: 사용자)
- [x] 모달 — 브라우저 `<dialog>` 컴포넌트 + 경로 모달 규칙도 이번에 정함 (선택: 사용자)
- [x] `@modal` 슬롯 위치 — 루트 layout 한 곳 (선택: 사용자 · Next.js 문서 모달 예제와 같은 구성)
- [x] 부품 범위 — 시안 디자인 기준 전부 (선택: 사용자)
- [x] 확인 방법 — `/dev/ui` 미리보기 + `/dev/ui/modal-demo`, 운영 404 (선택: 사용자)
