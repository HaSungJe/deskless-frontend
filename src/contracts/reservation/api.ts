import { AuthType, withAuth } from '@/shared/api/auth';
import { callQueue } from '@/shared/api/queue';
import { request } from '@/shared/api/request';
import { ReservationAvailabilityDto, ReservationAvailabilityResultDto } from './dto/reservation-availability.dto';
import { ReservationCancelRequestApproveResultDto } from './dto/reservation-cancel-request-approve.dto';
import { ReservationCancelRequestResultDto } from './dto/reservation-cancel-request.dto';
import { ReservationCancelDto, ReservationCancelResultDto } from './dto/reservation-cancel.dto';
import { ReservationDetailResultDto } from './dto/reservation-detail.dto';
import { ReservationExtendResultDto } from './dto/reservation-extend.dto';
import { ReservationExtensionResultDto } from './dto/reservation-extension.dto';
import { ReservationListDto, ReservationListResultDto } from './dto/reservation-list.dto';
import { ReservationPaymentConfirmDto, ReservationPaymentConfirmResultDto } from './dto/reservation-payment-confirm.dto';
import { ReservationQrResultDto } from './dto/reservation-qr.dto';
import { ReservationDto, ReservationResultDto } from './dto/reservation.dto';

/**
 * 예약 주소 — /user-service/reservation/<ID>
 *
 * @param reservation_id 예약 ID(주소에서)
 */
function reservationPath(reservation_id: string): string {
    return `/user-service/reservation/${encodeURIComponent(reservation_id)}`;
}

/**
 * 객실 그룹별 예약 가능 시간 — 동기 · 공개 (GET /user-service/reservation/availability)
 *
 * @param query 업체 · 날짜 · 상품 · 박수(연박) · 그룹(선택)
 * @param signal 상품 · 날짜가 바뀌거나 화면을 떠날 때 취소
 */
export function getAvailability(query: ReservationAvailabilityDto, signal?: AbortSignal): Promise<ReservationAvailabilityResultDto | null> {
    return request<ReservationAvailabilityResultDto>({
        path: '/user-service/reservation/availability',
        query: {store_id: query.store_id, date: query.date, room_plan_type_id: query.room_plan_type_id, nights: query.nights, room_group_id: query.room_group_id},
        signal,
    });
}

/**
 * 예약 생성 — 큐 · 이용자 (POST /user-service/reservation) — done 이면 결제 정보
 *
 * @param auth AuthContext 값
 * @param dto 호실 · 상품 · 날짜 · 시작 시각 · 박수
 */
export function createReservation(auth: AuthType, dto: ReservationDto): Promise<ReservationResultDto | null> {
    return withAuth(auth, (token) => callQueue<ReservationResultDto>({method: 'POST', path: '/user-service/reservation', body: dto, token}));
}

/**
 * 결제 확인 — 큐 · 이용자 (POST /user-service/reservation/payment-confirm) — 토스 승인 뒤
 *
 * @param auth AuthContext 값
 * @param dto 결제 ID(토스 orderId) · 결제 키(paymentKey)
 */
export function confirmPayment(auth: AuthType, dto: ReservationPaymentConfirmDto): Promise<ReservationPaymentConfirmResultDto | null> {
    return withAuth(auth, (token) => callQueue<ReservationPaymentConfirmResultDto>({method: 'POST', path: '/user-service/reservation/payment-confirm', body: dto, token}));
}

/**
 * 내 예약 목록 — 동기 · 이용자 (GET /user-service/reservation)
 *
 * @param auth AuthContext 값
 * @param query 페이지 · 개수
 * @param signal 페이지가 바뀌거나 화면을 떠날 때 취소
 */
export function getMyReservations(auth: AuthType, query: ReservationListDto, signal?: AbortSignal): Promise<ReservationListResultDto | null> {
    return withAuth(auth, (token) => request<ReservationListResultDto>({path: '/user-service/reservation', query: {page: query.page, size: query.size}, token, signal}));
}

/**
 * 내 예약 상세 — 동기 · 이용자 (GET /user-service/reservation/:reservation_id)
 *
 * @param auth AuthContext 값
 * @param reservation_id 예약 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getReservation(auth: AuthType, reservation_id: string, signal?: AbortSignal): Promise<ReservationDetailResultDto | null> {
    return withAuth(auth, (token) => request<ReservationDetailResultDto>({path: reservationPath(reservation_id), token, signal}));
}

/**
 * 내 예약 QR — 동기 · 이용자 (GET …/:reservation_id/qr) — 이용 중에만
 *
 * @param auth AuthContext 값
 * @param reservation_id 예약 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getReservationQr(auth: AuthType, reservation_id: string, signal?: AbortSignal): Promise<ReservationQrResultDto | null> {
    return withAuth(auth, (token) => request<ReservationQrResultDto>({path: `${reservationPath(reservation_id)}/qr`, token, signal}));
}

/**
 * 예약 취소 — 큐 · 이용자 (PATCH …/:reservation_id/cancel)
 *
 * @param auth AuthContext 값
 * @param reservation_id 예약 ID
 * @param dto 취소 사유
 */
export function cancelReservation(auth: AuthType, reservation_id: string, dto: ReservationCancelDto): Promise<ReservationCancelResultDto | null> {
    return withAuth(auth, (token) => callQueue<ReservationCancelResultDto>({method: 'PATCH', path: `${reservationPath(reservation_id)}/cancel`, body: dto, token}));
}

/**
 * 이용 중 취소 요청 조회 — 동기 · 이용자 (GET …/:reservation_id/cancel-request)
 *
 * @param auth AuthContext 값
 * @param reservation_id 예약 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getCancelRequest(auth: AuthType, reservation_id: string, signal?: AbortSignal): Promise<ReservationCancelRequestResultDto | null> {
    return withAuth(auth, (token) => request<ReservationCancelRequestResultDto>({path: `${reservationPath(reservation_id)}/cancel-request`, token, signal}));
}

/**
 * 이용 중 취소 요청 승인 — 큐 · 이용자 (PATCH …/cancel-request/approve)
 *
 * @param auth AuthContext 값
 * @param reservation_id 예약 ID
 */
export function approveCancelRequest(auth: AuthType, reservation_id: string): Promise<ReservationCancelRequestApproveResultDto | null> {
    return withAuth(auth, (token) => callQueue<ReservationCancelRequestApproveResultDto>({method: 'PATCH', path: `${reservationPath(reservation_id)}/cancel-request/approve`, token}));
}

/**
 * 이용 중 취소 요청 거절 — 큐 · 이용자 (PATCH …/cancel-request/reject) — 결과 DTO 가 null 이라 done · pending 이 같다
 *
 * @param auth AuthContext 값
 * @param reservation_id 예약 ID
 */
export function rejectCancelRequest(auth: AuthType, reservation_id: string): Promise<null> {
    return withAuth(auth, (token) => callQueue<null>({method: 'PATCH', path: `${reservationPath(reservation_id)}/cancel-request/reject`, token}));
}

/**
 * 연장 조회 — 동기 · 이용자 (GET …/:reservation_id/extension) — 잡아 두지 않는다
 *
 * @param auth AuthContext 값
 * @param reservation_id 예약 ID
 * @param signal 화면을 떠날 때 취소
 */
export function getExtension(auth: AuthType, reservation_id: string, signal?: AbortSignal): Promise<ReservationExtensionResultDto | null> {
    return withAuth(auth, (token) => request<ReservationExtensionResultDto>({path: `${reservationPath(reservation_id)}/extension`, token, signal}));
}

/**
 * 연장 신청 — 큐 · 이용자 (POST …/:reservation_id/extension) — done 이면 결제 정보
 *
 * @param auth AuthContext 값
 * @param reservation_id 예약 ID
 */
export function requestExtension(auth: AuthType, reservation_id: string): Promise<ReservationExtendResultDto | null> {
    return withAuth(auth, (token) => callQueue<ReservationExtendResultDto>({method: 'POST', path: `${reservationPath(reservation_id)}/extension`, token}));
}
