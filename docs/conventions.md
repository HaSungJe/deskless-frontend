# Conventions

## Naming

| 대상 | 규칙 | 예 (근거) |
|---|---|---|
| 화면 컴포넌트 | `<화면>Content`, 파일 이름 같음, default export | `LoginContent` (`src/features/user/login/LoginContent.tsx:13`) |
| page 컴포넌트 | 화면을 나타내는 PascalCase 함수, default export | `Login` (`src/app/(user)/login/page.tsx:3`), `Home` (`src/app/(user)/page.tsx`) |
| layout 컴포넌트 | `<영역>Layout` | `RootLayout` (`src/app/layout.tsx`) |
| 공통 컴포넌트 | PascalCase 파일 · default export · props 는 `type <Name>Props` | `KakaoMap` / `KakaoMapProps` (`src/shared/components/KakaoMap.tsx:10,47`) |
| 훅 | `use<Name>.ts` default export, 반환 타입 `Use<Name>Type` export | `useInput` / `UseInputType` (`src/shared/hooks/useInput.ts:3,11`) |
| 타입 | `type` 별칭 + `Type` 접미사 (`interface` 쓰지 않음) | `PaginationType` (`src/shared/types/pagination.ts:6`), `AccessTokenDecodeType` (`src/shared/types/access.ts:2`) |
| Context | `<Name>Context` | `IsLoginContext` (`src/shared/providers/RootLayoutProvider.tsx:15`) |
| 함수 | camelCase 동사 | `createQueryString` (`src/shared/utils/util.ts:7`), `loadAddressSearchScript` (`src/shared/utils/address.ts:19`) |
| 상수 | UPPER_SNAKE | `MAX_RELOAD` (`src/shared/api/axios.ts:12`), `KAKAO_MAP_SCRIPT_ID` (`KakaoMap.tsx:21`) |
| 화면 DTO | `<동작>Dto` class, 화면 폴더의 `dto.ts` | `LoginDto` (`src/features/user/login/dto.ts:4`) |
| 백엔드 DTO | 지침서 이름 그대로 — `<도메인><기능>Dto` · 응답 `…ResultDto` · path `…ParamDto` | `UserFindLoginIdDto` / `UserFindLoginIdResultDto` (지침서: frontend/dto/user.md:128,138) |
| 백엔드 키 | snake_case 그대로 (변환하지 않음) | `login_id`, `refresh_token_end_dt` (`dto.ts:6`, `LoginContent.tsx:58`) |

예외(기존): `Editor.tsx` 는 이름 있는 export `QuillEditor` 를 낸다 (`src/shared/components/Editor.tsx:59`).

## Files / Directories

- 화면: `src/features/<영역>/<화면>/` 한 폴더에 `<화면>Content.tsx` · 전용 컴포넌트 · `dto.ts` · `*.test.tsx` · `*.module.css` 를 같이 둔다.
- 여러 단어 유틸 파일은 kebab-case (`src/shared/api/axios-error.ts`), 한 단어는 소문자 (`util.ts`, `address.ts`, `cookie.ts`).
- 백엔드 DTO 는 `src/contracts/<도메인>/dto/<지침서 파일 이름>` — 파일을 나누거나 합치지 않는다(changes/ 문서가 파일 단위로 온다 — frontend/changes/README.md).
- 한 곳에서만 쓰는 것은 그 화면 폴더에, 두 곳 이상이면 `shared/`(도메인 무관) 또는 `contracts/`(백엔드 계약)로.

## Routes

- 주소는 지침서 그대로 — `frontend/screens.md` 의 화면 목록. ★ 표시 주소(`/reservation/[reservation_id]` 등)는 백엔드 SMS 링크라 바꾸지 않는다 (지침서: frontend/screens.md).
- 정적 세그먼트 kebab-case(`find-login-id`, `store-applications`), 동적 세그먼트 `[snake_case]`(`[store_id]`, `[reservation_id]`) (지침서: frontend/screens.md).
- 영역 layout 은 route group 으로 — 이용자 `(user)/`, 콘솔 `manager/(console)/` · `admin/(console)/`. 괄호 폴더는 주소에 나오지 않는다.
- `trailingSlash: true` (`next.config.ts:36`) — 내부 링크 · `router.push` 주소는 `/` 로 끝나게 쓴다.
- query 키도 snake_case (`search_type`, `all_search_yn` — 지침서: frontend/api.md "목록").

## 화면 · 컴포넌트 입력

- 컴포넌트 props 는 `type <Name>Props` 로 정의하고 구조 분해로 받는다. 기본값은 구조 분해 기본값으로 (`src/shared/components/Loading.tsx:14`, `KakaoMap.tsx:47`).
- 컴포넌트 함수는 반환 타입 `React.ReactNode` 를 적는다 (`LoginContent.tsx:13`, `AuthGuard.tsx:19`).
- 함수 콜백 props 는 `Function` 대신 시그니처로 (`closeFunc?: () => void` — `src/shared/components/Timer.tsx:7`).
- catch 의 error 는 `any` 로 받는다 (`src/shared/api/axios.ts:28`, `src/shared/api/axios-error.ts:10`).

## 스타일 (선택: 사용자 · 아직 CSS 없음)

- 컴포넌트 스타일은 같은 폴더의 `<Name>.module.css` (CSS Modules — 표준: Next.js 내장 지원).
- 색 · 간격 · 그림자는 시안 `frontend/design/<영역>.html` 의 `:root` CSS 변수(`--bg` · `--fg` · `--line` · `--danger` …)를 전역 토큰으로 옮겨 `var(--…)` 로만 쓴다. 영역마다 토큰 이름이 조금 다르다(관리자 `--bad` vs 이용자 `--danger`) — 첫 화면을 만들 때 전역/영역 토큰 파일을 정한다. <!-- TODO: globals.css 위치 · 영역 토큰 파일 확정 -->
- 글꼴은 Noto Sans KR (시안 `<link>`) — `next/font/google` 로 불러온다 (표준: Next.js 권장).
- 기존 코드의 인라인 `style` (`Loading.tsx:19-26`, `Timer.tsx:53`) 은 그대로 두고, 새 코드는 CSS Modules 로 쓴다.

## 코드 스타일

- `src/` 는 4칸 들여쓰기 · 세미콜론 (`src/shared/utils/validation.ts` 등). 설정 파일(`eslint.config.mjs`, `tsconfig.json`)은 2칸.
- export 하는 함수 · 컴포넌트에는 한국어 JSDoc — 한 줄 설명 + `@param` (`src/shared/utils/validation.ts:9-16`, `src/shared/api/axios.ts:14-19`).
- 배열 타입은 `Array<T>` (`src/shared/utils/validation.ts:31`, `useInputDate.ts:24`).
