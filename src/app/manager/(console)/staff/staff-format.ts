import { ManagerStaffDetailResultDto } from '@/contracts/manager/dto/manager-staff-detail.dto';
import { SegmentedOptionType } from '@/shared/components/ui/form/Segmented';

/** 업체 관리자 목록 주소 */
export const STAFF_LIST_PATH = '/manager/staff/';

/** 업체 총관리자가 아닐 때 안내 */
export const HEAD_MANAGER_ONLY_TITLE = '업체 총관리자만 볼 수 있는 화면입니다.';

/** 휴대폰 최대 자리 — ManagerStaffDto(01X + 7 ~ 8자리) */
export const PHONE_MAX = 11;

/** 성별 — 고르지 않음 '' */
export type GenderType = '' | 'M' | 'F';

/** 성별 고르기 */
export const GENDER_OPTIONS: Array<SegmentedOptionType<GenderType>> = [{value: 'M', label: '남'}, {value: 'F', label: '여'}];

/** 업체 관리자 칸(아이디 밖) */
export type StaffFormType = {
    name: string;       // 이름
    phone: string;      // 휴대폰(숫자만)
    gender: GenderType; // 성별
    birth: string;      // 생년월일(YYYY-MM-DD)
};

/** 등록 대화상자 빈 칸 — 성별은 고르지 않은 채로 */
export const EMPTY_STAFF_FORM: StaffFormType = {name: '', phone: '', gender: '', birth: ''};

/**
 * 업체 관리자 상세 주소
 *
 * @param userId 회원 ID
 */
export function staffPath(userId: string): string {
    return `${STAFF_LIST_PATH}${encodeURIComponent(userId)}/`;
}

/**
 * 받은 상세 → 칸(휴대폰 없음은 빈 칸)
 *
 * @param staff 업체 관리자 상세
 */
export function staffFormOf(staff: ManagerStaffDetailResultDto): StaffFormType {
    return {name: staff.name, phone: staff.phone ?? '', gender: staff.gender === 'F' ? 'F' : 'M', birth: staff.birth};
}
