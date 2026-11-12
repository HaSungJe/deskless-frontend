# Data Layer

프론트의 데이터 계층 = **백엔드 API 호출** + **토큰 쿠키(route handler)** + **전역 Context**. DB 는 없다.

## 백엔드 API 호출

### 지금 코드 (예전 백엔드 기준)
- axios 로 `${process.env.NEXT_PUBLIC_API_URL}/api/v1/...` 를 부른다 (`src/features/user/login/LoginContent.tsx:48`).
- 로그인 토큰이 필요한 호출은 `src/shared/api/axios.ts` 의 래퍼 — 401 이면 `/api/cookie/access` 로 토큰을 다시 받아 최대 5번 재시도, 그래도 안 되면 토큰을 지우고 에러를 던진다 (`axios.ts:20-47`). **호출처 0 — 미적용.** 시그니처(정의 그대로):
  ```ts
  axiosGet<T>(access: AccessType, url: string, headers?: Record<string, string>): Promise<AxiosResponse<T>>
  axiosPost<T>(access: AccessType, url: string, body?: unknown, headers?: Record<string, string>): Promise<AxiosResponse<T>>
  // axiosPut · axiosPatch · axiosDelete 도 axiosPost 와 같은 (access, url, body?, headers?)
  ```
  `AccessType` = `AccessTokenContextType & { reload?: number }` (`axios.ts:6-8`) — 화면에서는 `AccessTokenContext` 값(`{accessToken, setAccessToken}`)을 넘긴다.

### 지침서 기준 (만들 것 — frontend/api.md "호출 방식")
| 항목 | 규칙 |
|---|---|
| 주소 | `<게이트웨이>/api/v1/<user-service \| admin-service>/<도메인>/…`, 경로 값은 `encodeURIComponent` |
| 키 | 요청 · 응답 모두 snake_case |
| 입력 | `GET` 은 query, 그 밖은 JSON 본문 |
| 동기 | 조회 · 로그인 · 재발급 · 업로드 주소 발급 — 보통 JSON |
| 큐 | 상태를 바꾸는 쓰기 — `text/event-stream`: `accepted` → `done`(응답 DTO) · `failed`(실패 본문) · `pending`(30초 초과 — 다시 조회). `fetch` 스트림으로 읽는다(`callQueue` 예시 코드가 지침서에 있다) |
| 토큰 | 영역(이용자 · 매니저 · 관리자)마다 따로. 401 → 그 영역 `token-refresh` 로 한 번 재발급 후 재시도, 또 401 → 그 영역 로그인 화면(돌아올 주소와 함께) |
| 목록 | query `page` · `size` · `page_size` · `all_search_yn`, 응답 `{list, pagination}` |
| 파일 | 업로드 주소 발급(동기) → 브라우저가 S3 로 `PUT` → 등록 API(큐)에 `file_key` |
| 결제 | 토스 — 성공 주소에서 Next.js 서버가 승인 API 호출(시크릿 키) → `payment-confirm` |

`src/shared/api/` 에 동기 요청 · 큐(SSE) 호출 · 영역별 토큰 · 재발급을 만들고, 도메인별 엔드포인트 함수는 `src/contracts/<도메인>/api.ts` 에 둔다. <!-- TODO: shared/api 의 지침서 호출 클라이언트 -->

## 백엔드 계약 — `src/contracts/`

- `frontend/dto/<도메인>.md` 의 `## <도메인>/dto/<파일>.dto.ts` 블록을 `src/contracts/<도메인>/dto/<파일>.dto.ts` 로 **그대로** 옮긴다. 공통은 `frontend/dto/common.md` → `src/contracts/common/<파일>` (지침서: frontend/dto/common.md:3).
- 지침서 DTO 는 `class-validator` · `class-transformer` 데코레이터를 쓴다 (지침서: frontend/dto/user.md:3) — `class-transformer` 는 아직 설치돼 있지 않다. 첫 DTO 를 옮길 때 추가한다. <!-- TODO: class-transformer -->
- 백엔드 수정 요청(`frontend/changes/`)이 오면 해당 파일을 새 코드로 통째로 바꾼다.

## 토큰 쿠키 — route handler

| 쿠키 | 쓰는 곳 | 옵션 |
|---|---|---|
| `accessToken` | `POST /api/cookie/access` (`src/app/api/cookie/access/route.ts:100-125`), 재발급 시 `GET` 안에서 (`:64-71`) | `httpOnly`, `path: "/"`, `domain: SERVER_DOMAIN`, `sameSite: SERVER_DOMAIN ? "lax" : "strict"`, `secure: 개발이면 false, 아니면 x-forwarded-proto 가 https`, 만료 1분 전 |
| `refreshToken` | `POST /api/cookie/refresh` (`src/app/api/cookie/refresh/route.ts`) | 같은 옵션, 만료 기본 30일 |
| `sns` | next-auth `signIn` 콜백 (`src/app/api/auth/[...nextauth]/route.ts`) | `httpOnly`, `sameSite: "lax"`, 1시간 |

- 클라이언트는 쿠키를 직접 읽지 않고 `src/shared/api/cookie.ts` 의 함수로 route handler 를 부른다: `getAccessToken` · `getAccessTokenData` · `checkAuth` · `setAccessToken` · `setRefreshToken` · `deleteToken` · `getSNSAccessToken` · `deleteSNSAccessToken` (`cookie.ts`). 지금 호출되는 것은 `getAccessToken` · `deleteToken` · `setAccessToken` · `setRefreshToken` 뿐이다.
- `GET /api/cookie/access` 는 access 토큰이 없거나 만료 60초 이내면 refresh 토큰으로 재발급한다 (`access/route.ts:24`, `:44-92`).

## 전역 상태

- Context 3개만 쓴다 — `RootLayoutLoadingContext` · `AccessTokenContext` · `IsLoginContext` (`src/shared/providers/RootLayoutProvider.tsx:13-15`). 값은 `RootLayoutContent` 가 주소가 바뀔 때마다 채운다 (`src/app/RootLayoutContent.tsx:17-34`).
- 상태 관리 라이브러리 · 데이터 캐시 라이브러리는 없다. 화면 상태는 화면 컴포넌트의 `useState`.
- 브라우저 저장소: `sessionStorage.referer`(직전 주소 — `RootLayoutContent.tsx:20`), `localStorage.saveId`(아이디 저장 — `LoginContent.tsx:32,52`).

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
- `createQueryString(obj)` 는 키 · 값을 `encodeURIComponent` 해서 `?k=v&…` 를 만든다 (`src/shared/utils/util.ts:7-13`).
- `Pagination` props: `pagination: PaginationType`, `movePage: (page: string) => void` (`src/shared/components/Pagination.tsx:4-7`).

## Pagination 응답 타입

- 지금 `PaginationType` 은 camelCase(`totalCount` · `maxPage` · `pageRange`) (`src/shared/types/pagination.ts:6-14`).
- 지침서 응답은 snake_case(`total_count` · `max_page` · `page_range`) `PaginationResultDto` (지침서: frontend/dto/common.md:56) — 목록 화면을 만들 때 `contracts/common/pagination.dto.ts` 로 바꾸고 `Pagination` 컴포넌트도 맞춘다. <!-- TODO -->

## Query DTO 생성자

지침서 목록 query DTO 는 `PaginationDto` 를 extends 하고, 생성자에서 빠진 값을 `PAGINATION_DEFAULTS`(`page 1` · `size 20` · `page_size 10` · `all_search_yn 'N'`)로 채운다 (지침서: frontend/dto/common.md:13,38-43). 화면 DTO 도 생성자에서 입력 객체를 필드로 옮긴다 — 빈 값은 `null` (`src/features/user/login/dto.ts:11-15`).
