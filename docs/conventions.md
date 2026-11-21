# Conventions

## Naming

| 대상 | 규칙 | 예 (근거) |
|---|---|---|
| 화면 컴포넌트 | `<화면>Content`, 파일 이름 같음, default export | `UiPreviewContent` (`src/app/dev/ui/UiPreviewContent.tsx:63`) |
| page 컴포넌트 | 화면을 나타내는 PascalCase 함수, default export | `Login` (`src/app/(user)/login/page.tsx:5`), `Home` (`src/app/(user)/page.tsx`) |
| layout 컴포넌트 | `<영역>Layout` | `RootLayout` (`src/app/layout.tsx`) |
| 공통 컴포넌트 | PascalCase 파일 · default export · props 는 `type <Name>Props` | `StoreMap` / `StoreMapProps` (`src/shared/components/map/StoreMap.tsx:20,40`) |
| 훅 | `use<Name>.ts` default export, 반환 타입 `Use<Name>Type` export | `useInput` / `UseInputType` (`src/shared/hooks/useInput.ts:3,11`) |
| 타입 | `type` 별칭 + `Type` 접미사 (`interface` 쓰지 않음) | `PaginationType` (`src/shared/types/pagination.ts:11`), `AuthContextType` (`src/shared/providers/RootLayoutProvider.tsx:6`) |
| Context | `<Name>Context` | `AuthContext` (`src/shared/providers/RootLayoutProvider.tsx:18`) |
| 함수 | camelCase 동사 | `createQueryString` (`src/shared/utils/util.ts:7`), `loadAddressSearchScript` (`src/shared/utils/address.ts:35`) |
| 상수 | UPPER_SNAKE | `API_BASE_URL` (`src/shared/api/request.ts:5`), `KAKAO_MAP_SCRIPT_ID` (`src/shared/utils/kakao-map.ts:8`) |
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

- 컴포넌트 props 는 `type <Name>Props` 로 정의하고 구조 분해로 받는다. 기본값은 구조 분해 기본값으로 (`src/shared/components/Loading.tsx:15`, `StoreMap.tsx:40`).
- 컴포넌트 함수는 반환 타입 `React.ReactNode` 를 적는다 (`UiPreviewContent.tsx:63`, `AuthGuard.tsx:19`).
- 함수 콜백 props 는 `Function` 대신 시그니처로 (`closeFunc?: () => void` — `src/shared/components/Timer.tsx:7`).
- catch 의 error 는 `unknown` 으로 받아 좁힌다 (`src/shared/api/error.ts:21`).

## 스타일

- 토큰은 `src/app/css/globals.css` 한 곳 (선택: 사용자 · plan: `.beaver/output/plan/ui/design-foundation-plan.md`).
  - **색은 한 벌** — 세 시안(`frontend/design/*.html`)의 같은 값을 콘솔 시안 이름으로: `--bg` · `--surface` · `--surface-2` · `--line` · `--fg` · `--muted` · `--faint` · `--primary`(`-strong` · `-soft`) · `--on-primary` · `--ok` · `--warn` · `--danger`(각 `-soft`, `--danger-strong` 위험 채움 hover) · `--neutral-fg` · `--neutral-bg` · `--neutral-strong`(회색 채움 hover) · `--scrim` · `--shadow`. 이용자 전용 `--map-*` · `--primary-halo`(지도 현재 위치 점 테두리) · `--frame-shadow`(시안의 모바일 틀 그림자) · `--kakao` · `--naver`. 밝은 화면 한 벌.
  - **크기는 영역별** — 기본(이용자) 글자 15px · 컨트롤 48px, `[data-area="console"]` 글자 14px · 컨트롤 40px. 변수 `--font-size-base` · `--control-h`(`-sm` · `-lg`) · `--control-font` · `--control-weight` · `--control-px` · `--badge-h`. 영역 layout 이 감싸는 요소에 `data-area` 를 붙인다.
  - 모서리 `--radius`(8px) · `--radius-lg`(12px). 글꼴 `--font` = Noto Sans KR(`next/font/google`, `src/app/layout.tsx`) · 고정폭 `--mono`.
- css 는 css 폴더에 모은다 (선택: 사용자 2026-11-14).
  - 전역: `src/app/css/globals.css` (`src/app/layout.tsx` 가 import).
  - 화면: `src/app/css/<영역>/<화면>Content.module.css` — 예 `src/app/css/dev/UiPreviewContent.module.css`.
  - 공통 부품: `src/shared/css/` 아래에 `src/shared/components/` 와 같은 경로 — `shared/components/ui/form/Input.tsx` ↔ `shared/css/ui/form/Input.module.css`, `shared/components/Loading.tsx` ↔ `shared/css/Loading.module.css`. `shared` 의 css 를 `app/css` 에 두지 않는다(shared → app import 금지 — `eslint.config.mjs`).
  - import 는 별칭으로 — `import styles from '@/shared/css/ui/form/Input.module.css'`. 한 css 를 두 부품이 같이 쓸 수 있다(`Textarea` 가 `Input.module.css`).
- 색 · 크기 · 모서리는 토큰 `var(--…)` 만 쓰고 값(#hex, 높이 px)을 직접 쓰지 않는다. 계산되는 값(높이 %, 좌표 — 끄는 동안 위치 `ImageUploader` 의 @dnd-kit `transform`)만 인라인 `style`. 부품 크기를 화면이 바꿔야 하면 CSS 변수로 받는다(`StoreMap` 높이 `--store-map-h`).
  - 예외 — 영역(이용자 / 콘솔)에 따라 바뀌지 않는 **부품 고유 치수**는 시안 값을 그 부품 `module.css` 에 그대로 쓴다: 탭 높이 44px(`frontend/design/manager.html` `.tabs a`) · 스위치 40×24(손잡이 18) · 모달 닫기 32×32 · 모달 최대 너비 520px · 칩 최소 너비 40px · 선택 버튼 묶음 안쪽 모서리 6px · 알약 모양 모서리 999px · 페이지 탭 32×32(시안 `.pager a`) (`Tabs` · `Switch` · `Modal` · `Chip` · `Segmented` · `Badge` · `Pagination` `.module.css`). 영역 따라 바뀌는 높이(버튼 · 입력 · 배지)는 토큰.
  - 간격(`gap` · `padding`)과 글자 크기는 토큰이 없어 시안 값을 그대로 쓴다.
- 공통 부품은 `src/shared/components/ui/<종류>/` 를 먼저 쓴다. 모습은 개발 전용 `/dev/ui` 에서 본다. 지도 · 인증번호 · 사진 · 결제 부품(`map/` · `sms/` · `upload/` · `payment/`)은 [integrations.md](integrations.md) — 미리보기 `/dev/infra`.
  - `button/` — `Button`(모양 `variant` — 기본 · `primary` · `danger`(빨간 테두리) · `neutral`(회색 채움 — 로그아웃) · `dangerSolid`(빨간 채움 — 탈퇴 신청), `buttonClass()` 로 `<Link>` 를 버튼 모양으로) · `CopyButton`(`variant` · `full` 로 버튼 모양)
  - `form/` — `Input` · `Textarea` · `Select`(고르기 상자 — `Input` 과 같은 모양, `Input.module.css` 를 함께 쓴다) · `Field`(라벨 + 오류 span + 도움말) · `FieldError`(라벨 없는 표 · 줄 칸의 오류 span — `Field` 도 이걸 그린다) · `Switch` · `Chip` · `Segmented`
  - 줄 단위 검사 — 같은 DTO 가 여러 줄을 한 번에 보내면 `validateActionRows(dtos, path)`(`src/shared/utils/validation.ts`): 줄마다 검사하고 칸 이름을 `<path>.<줄>.<필드>`(백엔드 점 경로 — `hours.3.close_time`)로 붙인다. 부모 DTO 를 `validateAction` 하면 중첩 오류는 칸에 붙지 않는다(`constraints` 가 없어 건너뛴다).
  - 키로 나누는 검사 — 같은 이름의 칸이 한 화면에 여럿이고 카드 · 줄마다 따로 저장하면(상품 카드 3개 · 그룹 상품 줄 3개 · 기간 가격 대화상자의 `price` 와 그룹 상품 줄의 `price`), 또는 중첩 DTO 하나(`room_group_detail`)면 키로 나눈다. 칸은 `<Field dataKey={key}>` · `<FieldError dataKey={key}>`, 검사는 `resetValidationError()` 뒤 `validateActionChildren(dto, key)`(지우지 않으므로 먼저 지운다), 받은 오류는 `handleApiError(error, true, key)` — 키가 없으면 이름만으로 찾아 같은 이름의 첫 칸에 붙는다. 중첩 DTO 는 부모를 `validateAction`(그룹명 · 설명) + 안쪽을 `validateActionChildren`(방 개수)으로 둘 다 본다(`src/app/manager/(console)/room-groups/room-group-format.ts` `validateRoomGroup`).
  - 숫자 칸 → DTO 숫자는 `numberOf(value)`(`src/shared/utils/util.ts` — 빈 칸 undefined → IsNotEmpty 문구, 숫자가 아니면 NaN → IsInt 문구).
  - 콘솔(`src/shared/components/console/`) — `ConsoleShell`(왼쪽 메뉴 232px · 상단 바 · 본문 — 메뉴 · 글자는 영역 layout 이 넘긴다, `console-menu.ts` 의 `visibleMenu`(권한별) · `activeMenuHref`(지금 메뉴, `exact` 는 첫 화면만)) · `ConsoleAuthFrame` + `ConsoleAuthCard`(로그인 계열 — 메뉴 없는 바탕 + 가운데 카드)
  - `display/` — `Badge` · `Band`(상태 안내 띠 — `info` · `warn` · `danger` · `ok`) · `Card` · `Table` · `EmptyState`
  - `nav/` — `Tabs` · `Pagination`(`‹ 번호 ›`, 목록 응답의 `pagination` 을 그대로)
  - `modal/` — `Modal` · `ConfirmModal` · `ReasonModal` · `RouteModal` · `ErrorPopup`(루트에 하나 — `showErrorPopup` 으로 연다)
  - 새 부품은 맞는 종류 폴더에 넣는다. 같은 종류 폴더 안은 `./<Name>`, 다른 종류는 `@/shared/components/ui/<종류>/<Name>` 로 import.
- 입력 칸은 `<Field name="<DTO 필드>">` 로 감싼다 — 오류 span(`data-type="validation-alert"`)은 `Field` 가 그린다. 라디오 묶음처럼 입력이 여럿이면 `<Field name group>`(fieldset · legend — `src/app/(user)/signup/SignupContent.tsx` 성별), 도움말 줄에 글자 수를 나눠 둘 때는 `hint` 에 span.
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

### React Compiler 가 건너뛰는 모양

React Compiler(`next.config.ts:37`)는 아래 모양이 있는 컴포넌트 · 훅을 **통째로 건너뛴다** — 오류 없이 메모만 빠져, 렌더마다 자식 · 효과가 다시 돈다(`babel-plugin-react-compiler` 로 확인 2026-11-17).

- `try` 안의 값 갈래 — `??` · `?:` · `&&` · `?.`
- `finally` 가 있는 `try`, `catch` 없는 `try`
- 변수 영역의 `useEffectEvent` 가 그보다 아래에서 선언되는 값(`useState` 의 setter · 함수 영역의 함수)을 부르는 것 — 효과 이벤트는 값을 돌려주게만 두고, setState 는 효과 안 `.then` 에서 한다(`src/app/(user)/payments/success/PaymentSuccessContent.tsx` `loadView`)
- 훅이 아닌 함수의 이름을 `use…` 로 짓는 것 — 컴파일러가 훅으로 보고 함수 안(이벤트 처리 등)에서 부르면 "Hooks must be called at the top level" 로 건너뛴다. 계산 함수는 `use` 로 시작하지 않게(`src/app/manager/(console)/reservations/reservation-board-format.ts` `cancelRequestNotice` — 처음 이름 `useCancelNotice` 를 회귀 테스트가 잡음)
- 함수 영역에서 아래에 선언된 함수를 위의 함수가 부르는 것("Rewrite hoisted function references") — 불리는 함수를 먼저 선언한다(`src/app/admin/(console)/stores/[store_id]/_components/StoreStateCard.tsx` `send` → `submit` — 회귀 테스트가 잡음)
- `useRef` 를 쓰는 함수를 render 중에 부르는 함수의 인자로 넘기는 것("Cannot access refs during render") — 그 함수는 JSX 의 prop(`closeFunc` · `onClick` …)으로 직접 넘긴다(`src/app/(user)/reservation/[reservation_id]/ReservationDetailContent.tsx` `expirePending`)

그래서 **`try` 안에는 `await` 만** 두고, 결과 처리는 밖에서 한다 — 결과를 `let` 에 담고 `catch` 는 실패 처리 뒤 `return`, 정리(`setBusy(false)` 등)는 `try` 다음 줄에 (`src/app/(user)/stores/[store_id]/booking/BookingContent.tsx` `submit` · `src/shared/components/payment/TossPaymentWidget.tsx` `pay`). 오류를 부르는 쪽에 그대로 넘겨야 하는 공통 부품(`try … finally` 를 쓰던 곳)은 `catch` 에서 `{error}` 로 담고, 정리 뒤 다시 던진다(`src/shared/components/sms/SmsVerification.tsx` `send` · `src/shared/components/upload/ImageUploader.tsx` `chooseFile`).

`src/test/react-compiler.test.ts` 가 `src` 의 모든 컴포넌트(`.tsx`) · 훅(`use*.ts`)을 컴파일해 보고, 건너뛰는 것이 있으면 "파일:줄 이유" 로 실패한다.

```tsx
setSubmitting(true);
let result: ReservationResultDto | null;
try {
    result = await createReservation(auth, dto);
} catch (error) {
    setSubmitting(false);
    handleApiError(error);
    return;
}

setSubmitting(false);
if (!result) { … }
```

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
- `any` 는 쓰지 않는다 — 외부 SDK 전역(`window.kakao` · `window.daum`)만 이유를 단 `eslint-disable-next-line` 주석으로 (`src/shared/utils/kakao-map.ts:3`). catch 에서 쓰지 않는 오류는 `catch {`.
