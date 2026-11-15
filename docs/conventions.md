# Conventions

## Naming

| 대상 | 규칙 | 예 (근거) |
|---|---|---|
| 화면 컴포넌트 | `<화면>Content`, 파일 이름 같음, default export | `UiPreviewContent` (`src/app/dev/ui/UiPreviewContent.tsx:63`) |
| page 컴포넌트 | 화면을 나타내는 PascalCase 함수, default export | `Login` (`src/app/(user)/login/page.tsx:4`), `Home` (`src/app/(user)/page.tsx`) |
| layout 컴포넌트 | `<영역>Layout` | `RootLayout` (`src/app/layout.tsx`) |
| 공통 컴포넌트 | PascalCase 파일 · default export · props 는 `type <Name>Props` | `KakaoMap` / `KakaoMapProps` (`src/shared/components/KakaoMap.tsx:11,54`) |
| 훅 | `use<Name>.ts` default export, 반환 타입 `Use<Name>Type` export | `useInput` / `UseInputType` (`src/shared/hooks/useInput.ts:3,11`) |
| 타입 | `type` 별칭 + `Type` 접미사 (`interface` 쓰지 않음) | `PaginationType` (`src/shared/types/pagination.ts:11`), `AuthContextType` (`src/shared/providers/RootLayoutProvider.tsx:6`) |
| Context | `<Name>Context` | `AuthContext` (`src/shared/providers/RootLayoutProvider.tsx:18`) |
| 함수 | camelCase 동사 | `createQueryString` (`src/shared/utils/util.ts:7`), `loadAddressSearchScript` (`src/shared/utils/address.ts:20`) |
| 상수 | UPPER_SNAKE | `API_BASE_URL` (`src/shared/api/request.ts:5`), `KAKAO_MAP_SCRIPT_ID` (`KakaoMap.tsx:22`) |
| 화면 DTO | `<동작>Dto` class, 화면 폴더의 `dto.ts` | (지금 없음 — 첫 입력 화면 Phase 5) |
| 백엔드 DTO | 지침서 이름 그대로 — `<도메인><기능>Dto` · 응답 `…ResultDto` · path `…ParamDto` | `UserFindLoginIdDto` / `UserFindLoginIdResultDto` (지침서: frontend/dto/user.md:128,138) |
| 백엔드 키 | snake_case 그대로 (변환하지 않음) | `refresh_token`, `access_token_expires_at` (`src/contracts/user/dto/user-token-refresh.dto.ts:6,17`) |

예외(기존): `Editor.tsx` 는 이름 있는 export `QuillEditor` 를 낸다 (`src/shared/components/Editor.tsx:57`).

## Files / Directories

- 화면: 그 주소의 `page.tsx` 옆에 `<화면>Content.tsx` · `dto.ts` · `*.test.tsx` 를 같이 둔다(`src/app/(user)/login/`). 화면 css 는 `src/app/css/<영역>/<화면>Content.module.css` — 영역은 `user` · `manager` · `admin` · `dev` (선택: 사용자). 전용 부품이 여럿이면 `_components/` 로 묶는다 — 밑줄 폴더는 주소가 되지 않는다. 별도 `features/` 폴더는 두지 않는다 (선택: 사용자).
- 여러 단어 파일은 kebab-case (`src/contracts/common/fail-result.dto.ts`), 한 단어는 소문자 (`util.ts`, `address.ts`, `cookie.ts`).
- 백엔드 DTO 는 `src/contracts/<도메인>/dto/<지침서 파일 이름>` — 파일을 나누거나 합치지 않는다(changes/ 문서가 파일 단위로 온다 — frontend/changes/README.md).
- 한 곳에서만 쓰는 것은 그 화면 폴더에, 두 곳 이상이면 `shared/`(도메인 무관) 또는 `contracts/`(백엔드 계약)로.

## Routes

- 주소는 지침서 그대로 — `frontend/screens.md` 의 화면 목록. ★ 표시 주소(`/reservation/[reservation_id]` 등)는 백엔드 SMS 링크라 바꾸지 않는다 (지침서: frontend/screens.md).
- 정적 세그먼트 kebab-case(`find-login-id`, `store-applications`), 동적 세그먼트 `[snake_case]`(`[store_id]`, `[reservation_id]`) (지침서: frontend/screens.md).
- 영역 layout 은 route group 으로 — 이용자 `(user)/`, 콘솔 `manager/(console)/` · `admin/(console)/`. 괄호 폴더는 주소에 나오지 않는다.
- `trailingSlash: true` (`next.config.ts:36`) — 내부 링크 · `router.push` 주소는 `/` 로 끝나게 쓴다.
- query 키도 snake_case (`search_type`, `all_search_yn` — 지침서: frontend/api.md "목록").

## 화면 · 컴포넌트 입력

- 컴포넌트 props 는 `type <Name>Props` 로 정의하고 구조 분해로 받는다. 기본값은 구조 분해 기본값으로 (`src/shared/components/Loading.tsx:15`, `KakaoMap.tsx:54`).
- 컴포넌트 함수는 반환 타입 `React.ReactNode` 를 적는다 (`UiPreviewContent.tsx:63`, `AuthGuard.tsx:19`).
- 함수 콜백 props 는 `Function` 대신 시그니처로 (`closeFunc?: () => void` — `src/shared/components/Timer.tsx:7`).
- catch 의 error 는 `unknown` 으로 받아 좁힌다 (`src/shared/api/error.ts:21`).

## 스타일

- 토큰은 `src/app/css/globals.css` 한 곳 (선택: 사용자 · plan: `.beaver/output/plan/ui/design-foundation-plan.md`).
  - **색은 한 벌** — 세 시안(`frontend/design/*.html`)의 같은 값을 콘솔 시안 이름으로: `--bg` · `--surface` · `--surface-2` · `--line` · `--fg` · `--muted` · `--faint` · `--primary`(`-strong` · `-soft`) · `--on-primary` · `--ok` · `--warn` · `--danger`(각 `-soft`) · `--neutral-fg` · `--neutral-bg` · `--scrim` · `--shadow`. 이용자 전용 `--map-*` · `--primary-halo`(지도 현재 위치 점 테두리) · `--frame-shadow`(시안의 모바일 틀 그림자) · `--kakao` · `--naver`. 밝은 화면 한 벌.
  - **크기는 영역별** — 기본(이용자) 글자 15px · 컨트롤 48px, `[data-area="console"]` 글자 14px · 컨트롤 40px. 변수 `--font-size-base` · `--control-h`(`-sm` · `-lg`) · `--control-font` · `--control-weight` · `--control-px` · `--badge-h`. 영역 layout 이 감싸는 요소에 `data-area` 를 붙인다.
  - 모서리 `--radius`(8px) · `--radius-lg`(12px). 글꼴 `--font` = Noto Sans KR(`next/font/google`, `src/app/layout.tsx`) · 고정폭 `--mono`.
- css 는 css 폴더에 모은다 (선택: 사용자 2026-11-14).
  - 전역: `src/app/css/globals.css` (`src/app/layout.tsx` 가 import).
  - 화면: `src/app/css/<영역>/<화면>Content.module.css` — 예 `src/app/css/dev/UiPreviewContent.module.css`.
  - 공통 부품: `src/shared/css/` 아래에 `src/shared/components/` 와 같은 경로 — `shared/components/ui/form/Input.tsx` ↔ `shared/css/ui/form/Input.module.css`, `shared/components/Loading.tsx` ↔ `shared/css/Loading.module.css`. `shared` 의 css 를 `app/css` 에 두지 않는다(shared → app import 금지 — `eslint.config.mjs`).
  - import 는 별칭으로 — `import styles from '@/shared/css/ui/form/Input.module.css'`. 한 css 를 두 부품이 같이 쓸 수 있다(`Textarea` 가 `Input.module.css`).
- 색 · 크기 · 모서리는 토큰 `var(--…)` 만 쓰고 값(#hex, 높이 px)을 직접 쓰지 않는다. 계산되는 값(높이 %, 좌표)만 인라인 `style`.
  - 예외 — 영역(이용자 / 콘솔)에 따라 바뀌지 않는 **부품 고유 치수**는 시안 값을 그 부품 `module.css` 에 그대로 쓴다: 탭 높이 44px(`frontend/design/manager.html` `.tabs a`) · 스위치 40×24(손잡이 18) · 모달 닫기 32×32 · 모달 최대 너비 520px · 칩 최소 너비 40px · 선택 버튼 묶음 안쪽 모서리 6px · 알약 모양 모서리 999px · 페이지 탭 32×32(시안 `.pager a`) (`Tabs` · `Switch` · `Modal` · `Chip` · `Segmented` · `Badge` · `Pagination` `.module.css`). 영역 따라 바뀌는 높이(버튼 · 입력 · 배지)는 토큰.
  - 간격(`gap` · `padding`)과 글자 크기는 토큰이 없어 시안 값을 그대로 쓴다.
- 공통 부품은 `src/shared/components/ui/<종류>/` 를 먼저 쓴다. 모습은 개발 전용 `/dev/ui` 에서 본다.
  - `button/` — `Button`(`buttonClass()` 로 `<Link>` 를 버튼 모양으로) · `CopyButton`
  - `form/` — `Input` · `Textarea` · `Field`(라벨 + 오류 span + 도움말) · `Switch` · `Chip` · `Segmented`
  - `display/` — `Badge` · `Band`(상태 안내 띠) · `Card` · `Table` · `EmptyState`
  - `nav/` — `Tabs` · `Pagination`(`‹ 번호 ›`, 목록 응답의 `pagination` 을 그대로)
  - `modal/` — `Modal` · `ConfirmModal` · `ReasonModal` · `RouteModal` · `ErrorPopup`(루트에 하나 — `showErrorPopup` 으로 연다)
  - 새 부품은 맞는 종류 폴더에 넣는다. 같은 종류 폴더 안은 `./<Name>`, 다른 종류는 `@/shared/components/ui/<종류>/<Name>` 로 import.
- 입력 칸은 `<Field name="<DTO 필드>">` 로 감싼다 — 오류 span(`data-type="validation-alert"`)은 `Field` 가 그린다.
- 모달은 `<dialog>` 기반 `Modal` — 열려 있을 때만 내용을 그려, 다시 열면 입력이 비워진다. 사유 입력은 `ReasonModal`(필수면 빈 사유 막기 · 앞뒤 공백 제거 · `maxLength`).
- 기존 코드의 인라인 `style`(`Timer.tsx:45`)은 그대로 두고, 새 코드는 CSS Modules 로 쓴다.

## 컴포넌트 · 훅 안의 구조

컴포넌트 · 커스텀 훅 본문은 아래 순서로 두고, 영역 사이는 빈 줄로 나눈다 (선택: 사용자 2026-11-14).

| 순서 | 영역 | 들어가는 것 | 주석 |
|---|---|---|---|
| 1 | 변수 | props 로 만든 상수, 값을 돌려주는 훅(`useRef` · `useId` · `useRouter` · `useContext` · `useSearchParams` …) | 영역 `// 변수` + 줄마다 오른쪽에 역할 |
| 2 | 상태 | `useState` | 영역 `// 상태` + 줄마다 오른쪽에 역할 |
| 3 | 계산 값 | state 로 계산하는 값, `useMemo` | 영역 `// 계산 값` + 줄마다 오른쪽에 역할 |
| 4 | 효과 | `useEffect` | 영역 `// 효과` |
| 5 | 함수 | 이벤트 처리 · 내부 함수 · `useCallback` | 영역 `// 함수` |
| 6 | return | JSX | 덩어리마다 간략 주석 — 루트 위는 `return (` 안의 `// …`, 안쪽은 `{/* … */}` (훅은 없음) |

- 비어 있는 영역은 쓰지 않는다. JSX 안의 이벤트 처리는 화살표 함수로 길게 쓰지 않고 함수 영역의 이름 있는 함수로 뺀다.
- **새로 만드는 코드와 그때 고치는 파일부터** 적용한다 — 손대지 않는 기존 파일을 한꺼번에 고치지 않는다(그 파일을 고칠 때 맞춘다).

```tsx
function ReasonModalBody({maxLength = 200, required = true, busy = false, onConfirm, onClose}: ReasonModalBodyProps): React.ReactNode {
    // 변수
    const inputId = useId(); // 사유 칸 id — 라벨과 연결

    // 상태
    const [reason, setReason] = useState<string>(''); // 입력한 사유

    // 계산 값
    const trimmed = reason.trim();                         // 앞뒤 공백을 뺀 사유
    const blocked = (required && trimmed === '') || busy;  // 확인을 막을지

    // 함수
    function confirm(): void {
        if (!blocked) {
            onConfirm(trimmed);
        }
    }

    return (
        <>
            {/* 사유 칸 */}
            <Field label="사유" name="reason" htmlFor={inputId}>…</Field>

            {/* 버튼 줄 — 취소 · 확인 */}
            <div className={styles.actions}>…</div>
        </>
    );
}
```

## 코드 스타일

- `src/` 는 4칸 들여쓰기 · 세미콜론 (`src/shared/utils/validation.ts` 등). 설정 파일(`eslint.config.mjs`, `tsconfig.json`)은 2칸.
- export 하는 함수 · 컴포넌트에는 한국어 JSDoc — 한 줄 설명 + `@param` (`src/shared/utils/validation.ts:10-17`, `src/shared/api/request.ts`).
- 배열 타입은 `Array<T>` (`src/shared/utils/validation.ts:32`, `useInputDate.ts:31`).
- `any` 는 쓰지 않는다 — 외부 SDK 전역(`window.kakao` · `window.daum`)만 이유를 단 `eslint-disable-next-line` 주석으로 (`src/shared/components/KakaoMap.tsx:6`). catch 에서 쓰지 않는 오류는 `catch {`.
