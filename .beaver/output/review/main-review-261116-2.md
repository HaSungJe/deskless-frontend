# Review — main (Phase 4 이용자 공통 인프라) — 261116-2

> Pre-merge code review. Check the accumulated changes against the memory rules, AGENTS.md conventions, and the plan/spec intent.
> Location: `.beaver/output/review/` — `<stick>-review-<YYMMDD>.md` (stick = branch name with `/`→`-`, one per ship unit). For a re-review on the same day, append `-<N>`.

## Target
- stick: `main` (direct 모드) → origin: `main`
- Included features: Phase 4 이용자 공통 인프라 — #9 지도(`StoreMap` · `useMyLocation` · `loadKakaoMap`) · #10 주소 → 좌표(`searchAddressWithCoords`) · #11 인증번호(`SmsVerification`) · #12 파일 올리기(`uploadFile` · `imageContentType` · `ImageUploader`) · #13 토스 결제위젯(`TossPaymentWidget` · `requestTossConfirm` · `POST /api/payments/confirm/`) + 미리보기 `/dev/infra` + 패키지 4개
- Change scope: 코드 · 테스트 약 45파일(새 · 고침 · 삭제 1 — `KakaoMap.tsx`), `package.json` · `package-lock.json`, 문서 `docs/integrations.md`(새) · AGENTS.md · docs 4개, beaver 기록(spec · plan · report · 로드맵 · 이 문서). 같은 날 Phase 3 리뷰(`main-review-261116.md`)가 있어 `-2`.
- 검증: `npx vitest run` 20파일 121건 통과(첫 실행 115건 중 1건 실패 — 아래 #14), `npx next typegen && npx tsc --noEmit` 오류 0. `npm run lint` · `/dev/infra` 화면 확인은 사용자 실행 대상이라 아직.
- 리뷰 방식: 별도 에이전트가 읽기 전용으로 검토(SDK 타입 선언 · 토스 문서 기준까지) → 지적을 코드로 확인한 뒤 고침.

## Convention Check (against AGENTS.md)
| Item | Result | Notes |
|------|------|------|
| Naming | pass | `StoreMapProps` · `UseMyLocationType` · `SmsSentType` · `UploadStepsType` · `UploaderImageType` · `TossPaymentType` · `ConfirmResultType` · `ImageMimeType`, 상수 UPPER_SNAKE(`LOCATION_TIMEOUT_MS` · `IMAGE_TYPE_MESSAGE` · `TOSS_CONFIRM_URL` …) |
| Structure & layering | pass | `shared` 새 파일은 `shared` 만 import, `app/api/payments` 는 `route-util` · `cookie/token-cookie` 만. 컴포넌트 · 훅 본문 순서 · 주석 규칙(렌더 중 맞추기 블록 포함). route 파일은 `POST` 만 export(상수 · 함수는 `toss-confirm.ts`) |
| Shared logic extraction | pass | `json` · `isSameSiteJson` 을 두 route 가 쓰게 되어 `src/app/api/route-util.ts` 로. 카카오 로더 하나를 지도 · 주소가 같이 씀. 남은 `Timer` 재사용(인증번호 · 결제 마감) |
| Errors & responses | pass | 업로드 실패는 `ApiError` · `NetworkError`(화면 catch → `handleApiError`), 주소 좌표 실패는 오류 팝업, route 는 200 + `{success, message?, code?, retry?}` |
| Test strength | pass (#12 보강) | TDD `imageContentType` 9 · `toConfirmResult` 9, 호출 순서(`invocationCallOrder`) · 인자 · 실패 뒤 미호출. SDK 를 부르기만 하는 부분은 plan 대로 생략 |

## Intended Behavior Check (against plan/spec)
- spec Business Rules 의 지도 · 주소 · 인증번호 · 파일 · 결제 · 승인 중계 · 설정 · 지우는 것 — 코드와 테스트가 맞다. 사용자 결정(결제위젯 · npm SDK · `ANONYMOUS` · @dnd-kit · 서울시청 · TDD 범위) 반영.
- 리뷰에서 spec 이 다루지 않던 경우가 드러나 고쳤다: 권한 창 무응답(#1), 첫 클릭 팝업 차단(#2), 스크립트 실패 뒤 멈춤(#3), 같은 승인 동시 처리(#4), 보내는 중 번호 변경(#5), 결제 정보 교체(#6).
- 초안 규약(`docs/integrations.md` · AGENTS.md "## 외부 연동" · Checklist)을 고친 코드와 대조해 맞추고(실패 주소 `<basePath>` · 모바일 취소 코드 · 순서 API 뒤 다시 조회 · 자체 10초) 초안 표시를 지워 확정했다. `KakaoMap.tsx` · `json` 근거와 줄 번호는 스크립트로 대조.
- beaver 0.41.0(세션 중 업데이트)의 TDD 표기(`[ABOUT]` 설명 · 케이스 `// 이유`)로 spec · plan TDD 줄을 보완 — spec 보드 경고 0.
- memory: 미반영 항목 없음(`.beaver/memory/MEMORY.md`).

## Findings
| # | Severity | Location (path:line) | Description | Recommendation |
|---|--------|-----------------|------|------|
| 1 | Medium | `src/shared/hooks/useMyLocation.ts` (`readMyLocation`) | 브라우저 `timeout` 은 권한 창이 떠 있는 시간을 세지 않아, 답하지 않으면 끝없이 "확인 중" — 지도가 안 뜸 | 고침 — 자체 10초 타이머로 기본 위치, 늦게 온 위치는 버림. 테스트 추가 |
| 2 | Medium | `src/shared/utils/address.ts` (`searchAddressWithCoords`) | 팝업을 열기 전에 카카오 SDK 를 기다려, 첫 클릭에 클릭 직후가 지나 Safari 등이 팝업을 막고 조용히 멈출 수 있다 | 고침 — 팝업 먼저, 카카오는 좌표 구할 때 기다림. `preloadAddressSearch()` 로 화면이 미리 불러 둠 |
| 3 | Medium | `src/shared/utils/kakao-map.ts` · `address.ts` (로더) | 스크립트가 한 번 실패하면 남은 태그에 오지 않을 load 를 기다려 이후 호출이 멈춤 | 고침 — 실패 시 태그 삭제 |
| 4 | Medium | `src/app/api/payments/confirm/toss-confirm.ts` (`toConfirmResult`) | 같은 멱등 키 승인이 처리 중이면 토스가 409 `IDEMPOTENT_REQUEST_PROCESSING` — 실패로 보여 줌(두 탭 · 연달아 새로고침) | 고침 — retry. TDD 케이스 추가(토스 문서 기준 — 리뷰 에이전트 확인, 실제 응답은 테스트 키로 확인 필요) |
| 5 | Medium | `src/shared/components/sms/SmsVerification.tsx` | 보내는 중 번호를 고치면 새 번호가 보이는데 옛 번호의 인증으로 확인 | 고침 — 보내는 중 번호 칸 막기. 테스트 추가 |
| 6 | Low | `src/shared/components/payment/TossPaymentWidget.tsx` | 같은 인스턴스에 새 `payment` 가 오면 만료 · 준비 상태가 이전 그대로 | 고침 — 렌더 중 맞추기(새 결제 · 마감 → 만료 풀기, 금액 → 준비 끄기) |
| 7 | Low | `toss-confirm.ts` (`isConfirmRequest` · `confirmTossPayment`) | `paymentKey` 는 길이만 봐 줄바꿈 등이 헤더에 실려 fetch 가 던지면 retry 를 끝없이 / 토스 호출 제한 시간 없음 | 고침 — `^[A-Za-z0-9_-]{1,200}$`, `AbortSignal.timeout(30초)` → retry |
| 8 | Low | `src/app/api/payments/confirm/route.ts` | 로그인 검사는 refresh 쿠키가 있는지만, `Sec-Fetch-Site` 가 없으면 통과 — 브라우저 밖 도구는 가짜 쿠키로 승인을 부를 수 있다 | 받아들임 — spec 결정. 금액 · 주문은 백엔드가 토스에서 다시 읽어 대조 · 환불 |
| 9 | Low | `src/shared/components/upload/ImageUploader.tsx` (렌더 중 순서 맞추기) | 화면이 같은 사진을 새 배열로 넘기면 끌어 놓은 순서가 되돌아감 — "id 순서 비교" 제안 | 받아들이지 않음 — id 순서 비교면 순서 저장 실패 뒤 다시 조회해도 같아 저장 안 된 순서가 남는다. React Compiler 가 매핑을 데이터 기준으로 기억해 되돌아감은 데이터가 바뀔 때뿐. 화면 규칙을 docs/integrations.md 에 적음 |
| 10 | Low | `src/shared/components/map/StoreMap.tsx` (지도 효과) | 사라질 때 `idle` 듣기 · 지도 DOM 을 지우지 않아 다시 돌면(Fast Refresh) 지도가 겹칠 수 있다 / spec 에 없어진 `height` 속성 | 고침 — `removeListener` · `replaceChildren()`, spec 을 `--store-map-h` 로 |
| 11 | Low | `docs/integrations.md` | 실패 주소에 `<basePath>` 없음, 모바일 취소는 `USER_CANCEL` 이 아니라 실패 주소 `PAY_PROCESS_CANCELED` | 고침 — 문서 |
| 12 | Low | `src/test/…` | 빠진 테스트 — 업로드 주소 `null` · PUT 응답 없음, `Sec-Fetch-Site: cross-site`, "다시 받기", 토스 2회 호출 단언 | 고침 — 6건 더함(121건) |
| 13 | Low | `src/app/dev/infra/InfraPreviewContent.tsx` | 미리보기 사진 blob 주소를 풀지 않음 | 고침 — 삭제 때 `URL.revokeObjectURL` |
| 14 | Low | `src/test/shared/components/sms/SmsVerification.test.tsx` | 만료 테스트가 301초만 넘겨 실패 — `Timer` 는 남은 초를 버림(dayjs diff)해 만료 시각 뒤 1초 안에는 00:00 | 고침 — 302초 + 이유 주석(동작은 기존 `Timer` 그대로) |

## Verdict
Pass — #1 ~ #7 · #10 ~ #14 는 고쳤고(테스트 121건 · 타입 체크 통과), #8 은 spec 결정대로 받아들이고, #9 는 이유를 적어 지금 방식을 둔다. 커밋으로 진행.
