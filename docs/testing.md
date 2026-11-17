# Testing

Vitest 5 + Testing Library(`@testing-library/react`) + jsdom (선택: 사용자 · 설정 `vitest.config.mts`, 정리 `vitest.setup.ts`).
`vitest.config.mts` 의 `env.__NEXT_TRAILING_SLASH` 는 `next.config.ts` 의 `trailingSlash: true` 를 테스트에서도 켠다 — next build 가 넣는 값이라 없으면 `next/link` 의 `href` 끝 `/` 가 떨어진다.

## Testing Approach

- **단위 = 파일 하나**(DTO · 훅 · 유틸 · 컴포넌트 · 화면 Content). 경계 밖은 mock 한다:
  - HTTP — `fetch` (`vi.stubGlobal('fetch', fetchMock)` + `new Response(…)`, 테스트 뒤 `vi.unstubAllGlobals()` — `src/test/shared/api/request.test.ts`). 큐(SSE)는 조각마다 흘려보내는 `ReadableStream` 응답(`src/test/shared/api/queue.test.ts` 의 `sseResponse`)
  - 라우터 — `next/navigation` (`useRouter` · `usePathname` · `useSearchParams`)
  - 쿠키 · 토큰 — `@/shared/api/cookie`
  - 오류 팝업 — `vi.mock('@/shared/utils/error-popup')` 로 `showErrorPopup` 호출을 확인 (`src/test/shared/api/error.test.ts`). 팝업 자체는 `act(() => showErrorPopup(…))` 뒤 화면을 본다 (`src/test/shared/components/ui/modal/ErrorPopup.test.tsx`)
  - route handler — `vi.mock('next/headers')` 로 `cookies()` 에 가짜 cookieStore(`get` · `set`), `headers()` 는 `{get: () => null}` (`src/test/app/api/cookie/token-cookie.test.ts`)
  - `localStorage` · `sessionStorage` — `vi.spyOn`
- 실제 네트워크(백엔드 · 카카오 · 토스 · 다음 우편번호)는 단위 테스트에서 부르지 않는다.
- Context 는 실제 Provider(`RootLayoutProvider`)로 감싸서 값을 넣는다 — Context 자체는 mock 하지 않는다.
- class-validator DTO 는 mock 없이 실제 `validate()` 로 검증한다(지금 DTO 테스트 없음 — 첫 입력 DTO 때).
- `globals` 를 켜지 않으므로 `describe` · `it` · `expect` · `vi` 는 `vitest` 에서 import 한다. 렌더 정리는 `vitest.setup.ts` 의 `afterEach(cleanup)`.
- DOM 이 필요 없는 테스트(API 호출 · SSE 파서)는 파일 첫 줄 `// @vitest-environment node` — Node 의 `fetch` · `Response` · `ReadableStream` · `TextDecoder` 를 그대로 쓴다 (`src/test/shared/api/sse.test.ts:1`).
- jsdom 에는 `CSS.escape` · `innerText` 가 없다 — `vitest.setup.ts` 가 `CSS.escape` 를 간단히 채우고(오류 칸 선택자용), 칸 오류 확인은 `span.innerText` 를 읽는다(jsdom 에서는 그냥 속성이라 쓴 값이 그대로 읽힌다). 한 번도 쓰지 않은 칸은 `innerText` 가 `undefined` 라 "건드리지 않았다"는 `style.display` 로 확인한다 (`src/test/shared/api/error.test.ts`).

## Location · Structure

- 테스트는 `src/test/` 아래 src 와 같은 경로에 둔다 — `src/shared/api/request.ts` ↔ `src/test/shared/api/request.test.ts` (사용자 2026-11-15). 대상은 별칭 `@/…` 로 import 한다. `src/test` 는 import 방향 규칙 밖이라 `app` · `contracts` · `shared` 어느 것이든 시험한다. 수집 범위 `src/**/*.test.{ts,tsx}` (`vitest.config.mts`).
- `describe('<대상 이름>')` 안에 케이스 이름을 `[SUCCESS] …` / `[FAIL:<이유>] …` 로 시작한다 (`Pagination.test.tsx`).
- 분기마다 하나 이상: 성공 · 입력 검증 실패 · 서버 실패(`validation_errors` 있음 / 없음) · 401 · 빈 값.

| 대상 | 최소 케이스 |
|---|---|
| 화면 DTO | `[SUCCESS]` 정상 값 · `[FAIL:<규칙>]` 규칙마다 — `property` 와 한국어 `message` 까지 |
| 훅 · 유틸 | 입력 종류마다 결과 값 |
| 공통 컴포넌트 | 사용자 동작 → 콜백 호출 횟수 · 인자, 그리지 않는 조건 |
| 화면 Content | 제출 성공(부른 주소 · 본문 · 이동), 화면 검증 실패(API 미호출), 서버 실패(`handleApiError` 경로), 큐 `pending`(`null` → 다시 조회) |
| contracts api | 부른 메서드 · 주소 · 본문 키(snake_case) |
| React Compiler | `src/test/react-compiler.test.ts` 하나가 모든 컴포넌트 · 훅을 컴파일 — 건너뛰면 "파일:줄 이유" 로 실패([conventions.md](conventions.md) "React Compiler 가 건너뛰는 모양") |

## Strength Rules

결과 하나만 보지 않는다 — **호출 횟수 · 호출 인자 · 실패 뒤 미호출** 을 함께 확인한다.

### [SUCCESS]
```tsx
const movePage = vi.fn();
render(<Pagination pagination={pagination} movePage={movePage} />);
fireEvent.click(screen.getByRole('button', {name: '4'}));

expect(movePage).toHaveBeenCalledTimes(1);
expect(movePage).toHaveBeenCalledWith('4');
```
근거: `src/test/shared/components/ui/nav/Pagination.test.tsx`. API 를 부르는 화면은 mock 이 받은 **주소 · 본문**까지 확인한다(`toHaveBeenCalledWith(url, {login_id: …})`).

### [FAIL:*]
```tsx
fireEvent.click(screen.getByRole('button', {name: '2'}));   // 현재 페이지
expect(movePage).not.toHaveBeenCalled();
```
검증 실패 케이스는 API mock 이 **불리지 않았는지**(`not.toHaveBeenCalled()`), 서버 실패 케이스는 오류 처리 경로(칸 표시 · 오류 팝업)가 실행됐는지 확인한다.

## Data-Access Smoke (mock 경계의 빈틈)

- **빈틈**: 단위 테스트는 HTTP(fetch)를 mock 하므로, 실제 백엔드와의 **주소 · 메서드 · snake_case 키 · 응답 모양 · SSE 이벤트 파싱**은 어떤 테스트에서도 실행되지 않는다. 여기서 생긴 버그는 모든 테스트를 통과한다.
- 연결 없이 계약을 빌드해 볼 수단(ORM 메타데이터 같은 것)은 이 스택에 없다. 대신:
  1. `contracts/<도메인>/api.ts` 함수마다 mock 이 받은 **메서드 · 주소 · 본문 키**를 지침서(`frontend/api.md` 표)와 같은 값으로 단언한다.
  2. `shared/api` 의 큐(SSE) 호출은 가짜 `ReadableStream` 응답(`accepted` → `done` / `failed` / `pending`, 이벤트가 여러 조각으로 쪼개져 오는 경우 포함)으로 파싱을 검증한다 — 네트워크 없음.
  3. 실제 백엔드와 맞는지는 사용자가 `npm run dev` 로 확인한다(자동 E2E 없음).
- **규칙**: 백엔드를 부르는 함수는 mock 결과만 보는 테스트로 끝내지 않는다 — 위 1 · 2 처럼 보낸 요청 모양을 반드시 단언한다.

## Execution

- 전체: `npx vitest run` (`package.json` 의 `"test": "vitest"` 와 같은 러너)
- 하나: `npx vitest run <파일 이름 일부>` (예: `npx vitest run Pagination`)
- 타입 체크: `npx next typegen && npx tsc --noEmit` (`next-env.d.ts` · 라우트 타입을 먼저 만든다)
- Claude 는 테스트 · 타입 체크를 실행해도 된다. `npm run` 명령(dev · build · start · lint)은 사용자만 (AGENTS.md ⚠️).

## Handling Regression Test Failures

지금 작업과 상관없는 테스트가 깨지면 넘기지 않는다 — 원인을 찾고, 규약 위반이면 고치고, 판단이 애매하면 사용자에게 묻는다.
