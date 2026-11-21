import { STORE_STATE } from '@/contracts/common/store.constants';
import { StoreDetailResultDto } from '@/contracts/store/dto/store-detail.dto';
import { StoreUpdateDto } from '@/contracts/store/dto/store-update.dto';
import { formatBusinessNumber } from '@/shared/utils/format';
import { numberOf } from '@/shared/utils/util';

/** 업체 상태 배지 색 — 시안(활성 ok · 영업중지 danger · 탈퇴 neutral) */
export const STORE_STATE_TONE: Record<string, 'ok' | 'danger' | 'neutral'> = {
    [STORE_STATE.ACTIVE]: 'ok',
    [STORE_STATE.SUSPEND]: 'danger',
    [STORE_STATE.LEAVE]: 'neutral',
};

/** 영업중 배지 — is_open 1 영업중 · 0 영업준비 */
export const OPEN_BADGE = {
    open: {label: '영업중', tone: 'ok'},
    closed: {label: '영업준비', tone: 'neutral'},
} as const;

/** 탈퇴 업체 사업자등록번호 머리 — 백엔드가 DELETE_<업체 ID> 로 바꿔 준다 */
const LEFT_PREFIX = 'DELETE_';

/** 탈퇴 업체 사업자등록번호를 줄일 뒤 글자 수 — DELETE_ 뒤 앞 8자 */
const LEFT_SHORT = 8;

/** 업체 정보 칸 — 숫자 칸은 글자로 두고 보낼 때 숫자로 */
export type StoreFormType = {
    store_name: string;     // 상호명
    owner_name: string;     // 대표자명
    phone: string;          // 연락처 — 숫자만
    address: string;        // 주소 — 주소 검색이 채운다
    address_detail: string; // 상세주소
    latitude: string;       // 위도 칸 글자
    longitude: string;      // 경도 칸 글자
};

/**
 * 사업자등록번호 글자 — 보통은 123-45-67890, 탈퇴 업체(DELETE_…)는 줄여서 흐리게
 *
 * @param value business_number
 */
export function businessNumberText(value: string): {text: string; left: boolean} {
    return value.startsWith(LEFT_PREFIX) ? {text: `${value.slice(0, LEFT_PREFIX.length + LEFT_SHORT)}…`, left: true} : {text: formatBusinessNumber(value), left: false};
}

/**
 * 받은 업체 상세 → 정보 칸
 *
 * @param store 업체 상세
 */
export function storeFormOf(store: StoreDetailResultDto): StoreFormType {
    return {store_name: store.store_name, owner_name: store.owner_name, phone: store.phone, address: store.address, address_detail: store.address_detail ?? '', latitude: String(store.latitude), longitude: String(store.longitude)};
}

/**
 * 정보 칸 → 업체 정보 수정 보낼 값 — 상세주소는 빈 글자로도 보낸다(백엔드가 비우면 null — 빠뜨리면 지우지 못한다)
 *
 * @param form 정보 칸
 */
export function toStoreUpdateDto(form: StoreFormType): StoreUpdateDto {
    return Object.assign(new StoreUpdateDto(), {
        store_name: form.store_name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone,
        address: form.address.trim(),
        address_detail: form.address_detail.trim(),
        latitude: numberOf(form.latitude),
        longitude: numberOf(form.longitude),
    });
}
