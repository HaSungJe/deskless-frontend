/**
 * 문의 공통 값 — user-service(이용자 문의) · admin-service(문의 관리)가 함께 쓰고 DTO 허용값 · API 응답 값이기도 하다.
 * 값은 룩업 시드(libs/database/src/seeder/seeder.targets.ts)와 같다.
 */

/** 문의 상태(t_inquiry_state) — 접수 · 답변완료 · 블라인드 */
export const INQUIRY_STATE = {RECEIVED: 'RECEIVED', ANSWERED: 'ANSWERED', BLIND: 'BLIND'} as const;

/** 문의 상태 허용값 — 목록 거르기 DTO `@IsIn` */
export const INQUIRY_STATE_IDS: string[] = [INQUIRY_STATE.RECEIVED, INQUIRY_STATE.ANSWERED, INQUIRY_STATE.BLIND];

/** 문의 카테고리(t_inquiry_category) — 예약 · 결제/환불 · 객실/시설 · 출입/QR · 회원/계정 · 입점 · 기타 */
export const INQUIRY_CATEGORY = {RESERVATION: 'RESERVATION', PAYMENT: 'PAYMENT', ROOM: 'ROOM', DOOR: 'DOOR', ACCOUNT: 'ACCOUNT', STORE_APPLICATION: 'STORE_APPLICATION', ETC: 'ETC'} as const;

/** 문의 카테고리 허용값 — 등록(필수) · 목록 거르기(선택) DTO `@IsIn` */
export const INQUIRY_CATEGORY_IDS: string[] = Object.values(INQUIRY_CATEGORY);
