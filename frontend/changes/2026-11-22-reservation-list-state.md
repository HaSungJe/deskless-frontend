# 내 예약 목록 상태 거르기 — 프론트 수정 요청 반영 (2026-11-22)

- 백엔드: revision `.beaver/output/revision/reservation/reservation-booking-revision-261122-1.md` · 커밋 2026.11.22
- 요청: 프론트(deskless-frontend) U6 내 예약 `/reservation` — "내 예약 목록 상태 거르기"(2026-11-22)
- 반영 순서: 백엔드 배포 먼저 — 거르기 값이 없으면 지금처럼 전체를 돌려주므로 지금 화면은 그대로 동작한다

## 바뀐 이유
상태 칩(전체 · 결제 대기 · 예약 확정 · 이용 중 · 이용 완료 · 취소)으로 골라 보려는데 화면에서 거르면 받은 한 쪽 안에서만 걸러져 전체 개수 · 쪽 번호가 맞지 않았다. 서버가 거른다.

## 영향 화면
- U6 내 예약 `/reservation`

## API 변경
| 구분 | 메서드 · 주소 | 방식 | 바뀐 점 |
|---|---|---|---|
| 변경 | `GET /api/v1/user-service/reservation` | 동기 | query **`reservation_state_id`**(선택) — `PENDING` · `CONFIRMED` · `CHECKED_IN` · `COMPLETED` · `CANCELED` 중 하나, 없으면 전체. `pagination`(전체 개수 · 쪽 수 · 번호)은 거른 결과 기준. 목록 밖 값(`EXPIRED` · 소문자 등)은 400 `{message: '예약 상태가 올바르지 않습니다.', validation_errors: [{property: 'reservation_state_id', message: '예약 상태가 올바르지 않습니다.'}]}`. 응답 항목 · 정렬 · 로그인 · 그 밖의 실패는 그대로 |

## 확인하고 싶은 점에 대한 답
1. **`PENDING` 으로 거를 때 만료된 결제 대기는 빠진다.** 결제 시간이 지난 결제 대기는 상태가 `EXPIRED` 로 따로 바뀌고, `EXPIRED` 는 어떤 거르기에서도 나오지 않는다. 다만 결제 시간이 막 지난 건은 서버(scheduler — 1분마다)가 토스 결제를 조회해 확정 · 만료 · 환불로 정리하기 전까지 **최대 약 1분** `PENDING` 으로 보인다 — 늦게 결제가 끝난 건은 확정이 되어야 해서 시각만으로 미리 숨기지 않는다(지금의 전체 목록과 같다). 로컬 개발 환경(`NODE_ENV` 가 production 이 아님)에서는 scheduler 가 돌지 않아 결제 시간이 지나도 `PENDING` 으로 남는다.
2. **정렬은 상태와 상관없이 지금처럼 입실 일시 최근순**이다.

## 화면 구성과 쓰는 API 의 변경
- 상태 칩을 고르면 `reservation_state_id` 를 붙여 첫 쪽부터 다시 부른다. "전체" 는 값을 빼고 부른다.
- 쪽 번호 · 전체 개수는 응답의 `pagination` 을 그대로 쓴다(거른 결과 기준).

## 바뀐 DTO (Swagger 데코레이터를 뺀 사본 — contracts/reservation/dto/reservation-list.dto.ts, 결과 DTO 는 그대로)
```ts
import {IsIn, IsOptional} from 'class-validator';
import {PaginationDto} from '../../common/pagination.dto';

/**
 * 내 예약 목록 query — 상태(선택) · 페이지. 결제 대기 만료 건은 나오지 않는다, 입실 일시 최근순
 */
export class ReservationListDto extends PaginationDto {
    // 예약 상태 (PENDING: 결제 대기, CONFIRMED: 예약 확정, CHECKED_IN: 이용 중, COMPLETED: 이용 완료, CANCELED: 취소) — 없으면 전체
    @IsOptional()
    @IsIn(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELED'], {message: '예약 상태가 올바르지 않습니다.'})
    reservation_state_id: string | null;

    /**
     * @param data 요청 쿼리 — 빠진 페이지 값은 PaginationDto 기본값, 빠진 거르기는 null
     */
    constructor(data?: Partial<ReservationListDto>) {
        super(data);
        this.reservation_state_id = data?.reservation_state_id ?? null;
    }
}
```
