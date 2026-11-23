# Data Layer

프론트의 데이터 계층 = **백엔드 API 호출** + **토큰 쿠키(route handler)** + **전역 Context**. DB 는 없다.

## 백엔드 API 호출

부르는 곳은 백엔드 게이트웨이 하나 — `NEXT_PUBLIC_API_URL`(로컬 `http://localhost:3000`). 내부 서비스(이용자 3010 · 관리자 3020)는 직접 부르지 않는다. API 를 지침서와 맞춰 볼 때는 로컬 Swagger `http://localhost:3000/swagger` (→ [architecture.md](architecture.md) "로컬 포트").


### 호출 클라이언트 — `src/shared/api/` (fetch 하나 — 선택: 사용자 2026-11-15)
| 함수 | 쓰는 곳 | 결과 |
|---|---|---|
| `request<T>({method?, path, query?, body?, token?, signal?})` (`request.ts`) | 동기 — 조회 · 로그인 · 재발급 · 업로드 주소 발급 | JSON(빈 본문 · 204 는 `null`). 2xx 가 아니면 `ApiError(status, 실패 본문)`, 본문이 JSON 이 아니면 `ApiError(status, {message: "서버 응답을 읽을 수 없습니다.", validation_errors: null})` |
| `callQueue<T>({method, path, body?, token?, signal?})` (`queue.ts`) | 큐 — 상태를 바꾸는 쓰기(`text/event-stream`) | `done` → data, `pending` · 결과 없이 끝남 → `null`, `failed` → `ApiError(status_code, data)`, 스트림 전 실패(400 · 401 · 403) → `ApiError(status, 본문)` |
| `handleApiError(error)` (`error.ts`) | catch | 칸 옆 · 오류 팝업 — [error-handling.md](error-handling.md) |

- 주소는 `buildUrl(path, query)` = `${NEXT_PUBLIC_API_URL}/api/v1${path}${createQueryString(query)}`(`apiBaseUrl()` — 부를 때마다 실행 값을 읽는다, `getPublicEnv`) — `path` 는 `/user-service/…` · `/admin-service/…`, 경로 값은 부르는 쪽이 `encodeURIComponent`. query 는 `null` · `undefined` · 빈 문자열을 뺀다(`src/shared/utils/util.ts`).
- 헤더는 `Accept`(큐는 `text/event-stream`), 본문이 있으면 `Content-Type: application/json`, 토큰이 있으면 `Authorization: Bearer`.
- 큐 이벤트는 `takeSseEvents(buffer)`(`sse.ts`)가 자른다 — 빈 줄 경계, CRLF 허용, 여러 줄 `data:` 는 `\n` 으로 잇고 `:` 주석 줄은 무시. 결과는 지침서 예시 그대로(선택: 사용자) — 응답 DTO 가 `null` 인 큐 API 는 `done` 과 `pending` 이 같은 `null` 이라 화면은 `null` 이면 그 리소스를 다시 조회한다.
- 응답이 없는 실패(fetch `TypeError` · 본문 · 스트림 읽기 실패)는 `NetworkError`(원래 오류는 `cause`), 취소(`AbortError`)는 그대로 던진다. 화면을 떠날 때 취소하려면 `AbortController` 의 `signal` 을 넘긴다.
- 로그인이 필요한 API 는 `withAuth(auth, (token) => request · callQueue(…))` (`src/shared/api/auth.ts:31`) — 401 이면 `refreshAreaToken(area)`(같은 영역 동시 재발급은 하나로) → 한 번 재시도, 재발급 결과 로그인이 끝났거나(refresh 4xx) 또 401 이면 그 영역 토큰 삭제 · `onExpired()`(로그인 화면) · `LoginRequiredError`. 재발급이 일시 실패(네트워크 · 백엔드 5xx — route handler 가 `retry: true`)면 쿠키 · 로그인을 그대로 두고 `NetworkError` 를 던진다(화면은 네트워크 문구 팝업). 응답이 없는 실패(fetch 실패 · 큐 스트림 끊김)는 `NetworkError`(`request.ts` `sendRequest`), 취소는 `AbortError` 그대로.
- 도메인별 엔드포인트 함수는 `src/contracts/<도메인>/api.ts` 에 두고 그 함수가 `request` · `callQueue` 를 부른다(아직 없음 — 첫 화면 때).
- axios 는 쓰지 않는다(패키지 제거 — 사용자 2026-11-15). 예전 래퍼(`axios.ts` · `axios-error.ts`)는 지웠고, 토큰 쿠키 route handler 부르기(`src/shared/api/cookie.ts`) · 재발급(`src/app/api/cookie/token-cookie.ts` → `request`)도 fetch 다.

### 지침서의 나머지 호출 규칙 (frontend/api.md "호출 방식")
| 항목 | 규칙 |
|---|---|
| 토큰 | 영역(이용자 · 매니저 · 관리자)마다 따로. 401 → 그 영역 `token-refresh` 로 한 번 재발급 후 재시도, 또 401 → 그 영역 로그인 화면(돌아올 주소와 함께) — Phase 3 |
| 파일 | 업로드 주소 발급(동기) → 브라우저가 S3 로 `PUT` → 등록 API(큐)에 `file_key` — Phase 4 |
| 결제 | 토스 — 성공 주소에서 Next.js 서버가 승인 API 호출(시크릿 키) → `payment-confirm` — Phase 4 |

## 백엔드 계약 — `src/contracts/`

- `frontend/dto/<도메인>.md` 의 `## <도메인>/dto/<파일>.dto.ts` 블록을 `src/contracts/<도메인>/dto/<파일>.dto.ts` 로 **그대로** 옮긴다. 공통은 `frontend/dto/common.md` → `src/contracts/common/<파일>` (지침서: frontend/dto/common.md:3).
- 공통(`src/contracts/common/`): `pagination.dto.ts`(`PaginationDto` · `PAGINATION_DEFAULTS` · `PaginationResultDto`) · `fail-result.dto.ts`(`ApiFailResultDto` · `CommandFailedEventData`) · `roles.ts`(`AUTH_ID` · `LOGIN_SCOPE`) · `sse.ts`(`COMMAND_STREAM_EVENT`) · `reservation.constants.ts` — 지침서 사본 그대로. `lookup.ts`(`LOOKUP` · `lookupName`)는 지침서 "룩업 값" 표를 응답 필드 이름으로 묶은 것.
- `shared` 는 `contracts` 를 가져올 수 없어, 실패 본문(`ApiFailBodyType` — `request.ts`) · 페이지(`PaginationType` — `src/shared/types/pagination.ts`) · 큐 이벤트 이름(`queue.ts`)은 `shared` 에 구조가 같은 타입 · 상수로 따로 둔다.
- 지침서 DTO 는 `class-validator` · `class-transformer` 데코레이터를 쓴다 (지침서: frontend/dto/user.md:3). `class-transformer` 의 `@Type`(줄 목록 DTO — `store-mine-hours` · `store-mine-breaks`)은 클래스를 읽을 때 `Reflect.getMetadata` 를 부르므로 `reflect-metadata` 가 먼저 붙어 있어야 한다 — 서버 `src/instrumentation.ts`(`register`), 브라우저 `src/instrumentation-client.ts`(하이드레이션 전), 테스트 `vitest.setup.ts` 가 불러온다. 없으면 그 DTO 를 가져오는 순간 `Reflect.getMetadata is not a function`.

## 표시 형식 — `src/shared/utils/format.ts`

- 시각: `toKst(iso, format = 'YYYY-MM-DD HH:mm')` — dayjs `utc` · `timezone` 플러그인으로 `Asia/Seoul` 고정(서버 렌더링 · Docker UTC 에서도 같은 결과, 선택: 사용자). 빈 값 · 읽을 수 없는 값은 `''`. Z · 오프셋이 붙은 시각만 넘긴다 — 날짜 `YYYY-MM-DD` · 달 `YYYY-MM` · `HH:mm` 은 이미 한국 기준이라 그대로 보여 준다(오프셋 없는 문자열은 실행 환경 시간대로 읽혀 서버 · 브라우저 결과가 달라진다). 오늘 날짜(한국)는 `todayKst()`.
- 이용 시간: `formatDateTime(iso)` → `11월 12일(목) 19:00`, `formatDateTimeRange(시작, 끝)` → `11월 10일(화) 14:30 ~ 17:30`(한국 날짜가 다르면 `11월 14일(토) 20:00 ~ 11월 15일(일) 11:00`), `formatTimeRange(시작, 끝)` → `14:30 ~ 17:30` · `20:00 ~ 다음 날 11:00` · 이틀 넘으면 `20:00 ~ 11월 13일 11:00`. 날짜 문자열의 요일은 `formatMonthDayWeek('2026-11-12')` → `11월 12일(목)`(`Date.UTC` — 실행 환경 시간대와 무관).
- 번호 · 날짜: `formatPhone('01012345678')` → `010-1234-5678`, `formatPhone('0212345678')` → `02-1234-5678`, 8자리 대표번호 `1577-1234`(모양이 다르면 그대로), `formatBusinessNumber('1234567890')` → `123-45-67890`, `formatKoreanDate('1998-03-14')` → `1998년 3월 14일`(ISO 시각은 한국 날짜로). 입력은 `digitsOnly('010-1234 5678', 11)` → `01012345678`, 숫자 칸은 `numberOf('3')` → `3`(빈 칸 → `undefined`).
- 금액: `formatPrice(12000)` → `12,000원`. 요일: `daysToBits([1, 3, 5])` → `42`, `bitsToDays(42)` → `[1, 3, 5]`, `formatDays(42)` → `월 · 수 · 금`, `formatDays(31)` → `일 ~ 목`(3일 이상 이어지면 범위 — 토 다음 일로 주를 넘어도, `formatDays(97)` → `금 ~ 일`), `formatDays(127)` → `매일` (0 일 ~ 6 토).
- 상태 · 종류 이름: 응답 `*_name` 먼저, 없으면 `lookupName('reservation_state_id', 'CONFIRMED')` → `예약 확정` (모르는 값은 그대로).
- 백엔드 수정 요청(`frontend/changes/`)이 오면 해당 파일을 새 코드로 통째로 바꾼다. 반영한 문서 — `2026-11-18-store-login-store.md`(매니저 로그인용 업체 확인 `GET /admin-service/store/login-store/:store_code` — `src/contracts/store/dto/store-login-store.dto.ts` · `getLoginStore`, Phase 10 revision 261118-1) · `2026-11-19-door-state-removed.md`(문 열림 · 닫힘 대신 마지막으로 연 시각 `door_opened_at` — `src/contracts/room/dto/room-list.dto.ts` · `room-door-open.dto.ts`, 룩업 `door_state` 지움, Phase 12) · `2026-11-20-room-group-detail-floors.md`(그룹 상세 `price_count` · `room_count` · `rooms`, 호실 목록 `floors` — `src/contracts/room/dto/room-group-detail.dto.ts` · `room-list.dto.ts`, Phase 12) · `2026-11-22-discovery-filter.md`(업체 검색 반경 `ALL` 거리 제한 없음 · 추가정보 필터 `detail_filter` · 항목 API `room-group-detail-filter` — `src/contracts/discovery/dto/discovery-store-list.dto.ts` · `discovery-room-group-detail-filter.dto.ts` · `getRoomGroupDetailFilters`, 지도 화면 반경 칩 "제한 없음" · 추가정보 팝업 `src/app/(user)/_components/DetailFilterModal.tsx` — 항목은 화면에 적지 않고 받은 목록 그대로) · `2026-11-22-reservation-list-state.md`(내 예약 목록 상태 거르기 `reservation_state_id` — `src/contracts/reservation/dto/reservation-list.dto.ts`, 내 예약 상태 칩) · `2026-11-22-monitoring-web.md`(Next.js 서버 지표 — `prom-client` · `src/instrumentation.ts` · `src/metrics-server.ts`, compose 서비스 이름 `web` · 모니터링 망 `deskless-monitoring` · `METRICS_PORT` · `METRICS_HOST`, 화면 · API 는 그대로 — compose · 모니터링 망 부분은 아래 k8s-cleanup 이 대신) · `2026-11-23-k8s-cleanup.md`(compose · `docker:up` · `docker:down` 지움 — 배포는 deskless(쿠버네티스), 지표 포트에 헬스 체크 `/health/live` · `/health/ready` — `src/metrics-server.ts` `markMetricsReady` · `src/instrumentation.ts`, 문서 · 주석의 compose · 모니터링 망 안내를 deskless 기준으로, 화면 · API 는 그대로) · `2026-11-24-runtime-public-env.md`(공개 값 `NEXT_PUBLIC_*` 를 실행 때 읽기 — `src/shared/utils/public-env.ts`(`getPublicEnv` · `publicEnvValues` · `applyPublicEnv`), 루트 layout `await connection()` · `generateMetadata` · `RootLayoutContent publicEnv`, `apiBaseUrl()`, `Dockerfile` `ARG DESKLESS_BUILD_ENV_HASH`, `.env.example` 표시 `[실행]`(basePath · 이미지 호스트만 `[빌드]`), 화면 · API 는 그대로).
- 객실 옵션(객실 그룹 상세정보 `room_group_detail` 의 켜고 끄는 항목 — 샤워실 · TV · PC …)은 `ROOM_GROUP_OPTIONS`(`src/contracts/common/room.constants.ts`) 한 곳에 키 · 이름을 둔다 — 업체 관리자 그룹 칸(스위치)과 이용자 업체 상세(칩)가 이 목록을 그린다. 백엔드가 항목을 더하면(반려동물 동반 · 배달 가능 등) 그 DTO 사본들에 필드를 더하고 이 목록에 한 줄을 더한다(목록의 키가 DTO 에 없으면 타입 검사가 잡는다).

## 토큰 쿠키 — route handler

영역(`user` · `manager` · `admin`)마다 쿠키 두 개(쿠키 이름으로 나눔 — 사용자 2026-11-15). 공용 코드 `src/app/api/cookie/token-cookie.ts`.

| 쿠키 | 쓰는 곳 | 옵션 |
|---|---|---|
| `<area>_access_token` | `POST /api/cookie/<area>/`(로그인 결과 저장), `GET` · `POST …/refresh/` 안의 재발급 (`token-cookie.ts:88`) | `httpOnly`, `path: "/"`, `domain: SERVER_DOMAIN`(빈 값이면 없음), `sameSite: SERVER_DOMAIN ? "lax" : "strict"`, `secure: 개발이면 false, 아니면 x-forwarded-proto 가 https`, 만료 = `access_token_expires_at` − 60초 |
| `<area>_refresh_token` | 같은 곳 | 같은 옵션, 만료 = `refresh_token_expires_at` |
| `<area>_account`(매니저 · 관리자) | 로그인 route 가 `{login_id, auth_id}` JSON 으로 씀(`setAccountCookie`), 재발급 때 새 refresh 만료로 다시 씀, `clearTokenCookies`(로그아웃 · 로그인 만료)가 토큰과 함께 지움, `POST /api/cookie/<area>/` 로 토큰만 저장해도 지움 | 같은 옵션, 만료 = `refresh_token_expires_at` |
| `manager_store_code` | 매니저 로그인 route 가 씀(`setRememberCookie`), 업체 로그인 주소 안내 page(`src/app/manager/login/page.tsx`)가 읽어 그 업체 로그인으로 보냄 — 로그아웃이 지우지 않는다 | 같은 옵션, 만료 = 1년 |
| `next-auth.session-token`(https 면 `__Secure-…`) | next-auth(`src/app/api/auth/[...nextauth]/route.ts`) — SNS 계정(`sns_id` · `sns_user_id`)만, `/api/user/sns-login/` · `/api/user/sign/` 가 `getToken` 으로 읽고 이용자 토큰을 심으면 지운다 | next-auth 기본(httpOnly · `NEXTAUTH_SECRET` 암호화), 10분 |

| route handler | 하는 일 | 결과 |
|---|---|---|
| `GET /api/cookie/<area>/` | access 쿠키 값, 없으면(곧 만료 포함) refresh 쿠키로 그 영역 token-refresh → 두 쿠키 새로 | `{success, data: access}` / 로그인이 끝났으면(refresh 없음 · 4xx) 두 쿠키 삭제 · `{success: false}` / 일시 실패(네트워크 · 5xx)면 쿠키를 두고 `{success: false, retry: true}` |
| `POST /api/cookie/<area>/` | 로그인 결과 토큰 4개 저장 — 같은 사이트 JSON 요청만(`Content-Type: application/json`, `Sec-Fetch-Site` 가 있으면 `same-origin`), 토큰 4개가 다 있고 만료 시각을 읽을 수 있을 때만, 그 영역 계정 쿠키는 지운다(계정은 로그인 route 만 쓴다) — 지금 부르는 화면은 없다(매니저 · 관리자 로그인은 서버 route) | `{success}` |
| `DELETE /api/cookie/<area>/` | 로그아웃 — 그 영역 두 쿠키만 삭제(로그아웃 API 없음) | `{success}` |
| `POST /api/cookie/<area>/refresh/` | 401 뒤 강제 재발급 | `GET` 의 재발급과 같음 — 로그인이 끝났으면 두 쿠키 삭제, 일시 실패면 `retry: true` |
| `GET /api/cookie/<area>/account/` | 로그인 때 기억한 계정 읽기(쓰기는 로그인 route 만) | `{success, data: {login_id, auth_id}}` / 없으면 `{success: false}` |

이용자 로그인 · 가입 route(`src/app/api/user/` — 사용자 2026-11-16, SNS 계정을 브라우저에 내보내지 않으려고 서버가 백엔드까지 부른다)와 매니저 · 관리자 로그인 route(`src/app/api/manager/login/` — 사용자 2026-11-18 · `src/app/api/admin/login/` — Phase 15, 로그인 IP 와 재발급 IP 를 맞추려고 — 앞부분은 `backendLogin`(`src/app/api/route-util.ts`) 하나, 화면 쪽은 `postRoute` · `routeFailure`(`src/shared/api/route.ts`)):

| route handler | 하는 일 | 결과 |
|---|---|---|
| `GET /api/user/sns-login/?return_url=` | next-auth callbackUrl — SNS 세션(`getToken`)으로 백엔드 `user/login` → 이용자 토큰 쿠키(`setTokenCookies`) · next-auth 쿠키 삭제 | 303 `afterLoginPath`(휴대폰 인증 전이면 `/phone-verification/`) / 가입 전(404) `/signup/?sns=…` / `/login/?error=sns · login · retry` |
| `POST /api/manager/login/` | 같은 사이트 JSON `{store_code, login_id, login_pw}` → 백엔드 `manager/login`(동기) → 매니저 토큰 · 계정 · 업체코드 쿠키 | `{success, data: {is_password_change_required}}` / 거절(4xx) `{success: false, message, validation_errors, block_comment}`(쿠키 안 씀) / `{success: false, message, retry: true}` |
| `POST /api/admin/login/` | 같은 사이트 JSON `{login_id, login_pw}` → 백엔드 `admin/login`(동기) → 관리자 토큰 · 계정 쿠키(업체코드 쿠키 없음) | 매니저 로그인과 같다 |
| `POST /api/user/sign/` | 같은 사이트 JSON `{gender, birth, nickname}` + SNS 세션 → 백엔드 `user/sign`(큐, 결과 없이 끝나면 `user/login` 으로 한 번 다시 조회) → 토큰 쿠키 · next-auth 쿠키 삭제(https 의 `__Secure-` · `__Host-` 이름은 secure 로) | `{success, data: {is_phone_verified}}` / `{success: false, code: 'NO_SNS'}` / `{success: false, message, validation_errors}` / `{success: false, message, retry: true}` |

- ⚠️ 백엔드 재발급은 지금 로그인 때 IP 와 재발급 요청 IP 가 다르면 401 이다 — 재발급은 Next 서버가 부르므로 배포 환경에서는 access 토큰이 끝날 때 로그인이 풀린다(로컬은 IP 가 같아 영향 없음). 백엔드에 IP 검사 완화를 요청했다(2026-11-16). 이용자(`/api/user/sns-login/`) · 매니저(`/api/manager/login/`) · 관리자(`/api/admin/login/`)는 로그인도 Next 서버가 부르므로 IP 가 같다.
- 영역별 재발급 API: 이용자 `/user-service/user/token-refresh` · 매니저 `/admin-service/manager/token-refresh` · 관리자 `/admin-service/admin/token-refresh` (`src/contracts/{user,manager,admin}/api.ts`, 본문 `{refresh_token}`).
- 클라이언트는 쿠키를 직접 읽지 않고 `src/shared/api/cookie.ts` 로 route handler 를 부른다 — `getAreaToken` · `saveAreaTokens` · `deleteAreaTokens` · `getAreaAccount`(로그인 때 기억한 아이디 · 권한) · `refreshAreaToken`(같은 영역 동시 재발급은 진행 중인 하나를 나눈다 — refresh 토큰이 재발급마다 바뀌어서. 로그인이 끝났으면 `null`, `retry` · 응답 없음이면 `NetworkError`). 주소는 `trailingSlash` 에 맞춰 `/` 로 끝내고 앞에 basePath 를 붙인다(`withBasePath` — docs/architecture.md "basePath").

## 전역 상태

- Context 2개 — `RootLayoutLoadingContext`(그 영역 토큰 확인 중) · `AuthContext`(`{area, token, isLogin, setToken, onExpired, logout}`) (`src/shared/providers/RootLayoutProvider.tsx:17-18`). 값은 `RootLayoutContent` 가 주소가 바뀔 때마다 그 영역 토큰을 확인해 채운다 — 영역이 바뀐 직후(새 영역 토큰을 확인하기 전)는 확인 중 · 로그인 안 됨, 로그인 안 된 상태는 주소마다 확인이 끝날 때까지 확인 중 (`src/app/RootLayoutContent.tsx:54-66`). 늦게 끝난 재발급 · 만료 처리는 그 사이 영역이 바뀌었으면 무시한다(`changeToken` · `expire`). `logout()` 은 그 영역 토큰 쿠키만 지우고 성공 여부를 돌려준다 — 로그인 상태(`token`)는 바꾸지 않고, 부른 화면이 `replaceDocument('/')` 로 문서를 새로 연다(상태를 바꾸면 `AuthGuard` 가 먼저 로그인 화면으로 보낸다).
- 상태 관리 라이브러리 · 데이터 캐시 라이브러리는 없다. 화면 상태는 화면 컴포넌트의 `useState`.
- 브라우저 저장소는 쓰지 않는다 — 로그인 뒤 돌아올 주소는 `?return_url=`(`src/shared/utils/area.ts`). 오류 팝업은 모듈 상태 저장소(`src/shared/utils/error-popup.ts`)를 `useSyncExternalStore` 로 읽는다.

## 목록 페이지 패턴 (기존 규칙 — 아직 적용된 화면 없음)

검색 + 정렬 + 페이지네이션 목록. `queryString` state 하나로 검색 트리거를 모은다.

```tsx
// 1. 초기값은 URL searchParams 에서 읽어 뒤로가기 때 상태 복원
const searchParams = useSearchParams();
const [page, setPage] = useState<string>(searchParams.get('page') ?? '1');
const searchType = useInput(searchParams.get('search_type') ?? 'ALL');

// 2. queryString state — 모든 검색 조건을 하나로
const [queryString, setQueryString] = useState<string>(createQueryString({ page, ... }));

// 3. useEffect 체인
useEffect(() => { search(); }, []);                                              // ① 처음 조회
useEffect(() => { setQueryString(createQueryString({...})); }, [page]);          // ② 페이지 변경 → queryString
useEffect(() => { setQueryString(createQueryString({...})); }, [sort1, sort2]);  // ③ 정렬 변경 → queryString (정렬 있을 때만)
useEffect(() => { search(); }, [queryString]);                                   // ④ queryString 변경 → API 호출

// 4. 검색 버튼 — page 를 1로 되돌려 queryString 갱신 → ④ 가 search()
function action() {
    setQueryString(createQueryString({ page: 1, ...searchConditions }));
}

// 5. 페이지네이션 — movePage 에 setPage 를 그대로
<Pagination pagination={pagination} movePage={setPage} />
```
- `useSearchParams` 를 쓰므로 page 에서 `<Suspense>` 로 감싼다.
- `createQueryString(obj)` 는 `null` · `undefined` · 빈 문자열을 빼고 키 · 값을 `encodeURIComponent` 해서 `?k=v&…` 를 만든다 (`src/shared/utils/util.ts:7-14`).
- `Pagination` props: `pagination: PaginationType | null`, `movePage: (page: string) => void`, `label?` (`src/shared/components/ui/nav/Pagination.tsx:5-9`).

## Pagination 응답 타입

- `PaginationType` 은 snake_case(`all_search_yn` · `total_count` · `page` · `max_page` · `page_range{start, end}` · `content_start_number` · `content_start_number_reverse`) — 지침서 `PaginationResultDto`(`src/contracts/common/pagination.dto.ts`)와 같은 구조 (`src/shared/types/pagination.ts`).
- `Pagination` 은 시안(`frontend/design/manager.html` `.pager`)대로 `‹ 번호 ›` — 현재 페이지는 `aria-current="page"` 이고 눌러도 이동하지 않는다, 1쪽이면 이전 · 마지막 쪽이면 다음이 막힌다. 처음 · 마지막 버튼은 없다.

## Query DTO 생성자

지침서 목록 query DTO 는 `PaginationDto` 를 extends 하고, 생성자에서 빠진 값을 `PAGINATION_DEFAULTS`(`page 1` · `size 20` · `page_size 10` · `all_search_yn 'N'`)로 채운다 (지침서: frontend/dto/common.md:13,38-43).
