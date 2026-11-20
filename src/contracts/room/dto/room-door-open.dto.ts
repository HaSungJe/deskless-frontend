import {IsNotEmpty, Matches} from 'class-validator';

/**
 * 호실 문 바로 열기 path — 내 업체의 지워지지 않은 호실만(없으면 404)
 */
export class RoomDoorOpenParamDto {
    /** 호실 ID */
    @Matches(/^[a-f0-9]{32}$/, {message: '호실 ID가 올바르지 않습니다.'})
    @IsNotEmpty({message: '호실 ID를 입력해주세요.'})
    room_id: string;
}

/**
 * 바로 열기 결과 — 서버는 마지막으로 연 시각을 쓰고 그 업체 문 소켓에 열기 명령(door.open)을 보낸다. 실제 문은 문 쪽 프로그램이 연다(열림 · 닫힘 상태는 두지 않는다)
 * - frontend/changes/2026-11-19-door-state-removed.md
 */
export class RoomDoorOpenResultDto {
    /** 연 문의 호실 ID */
    room_id: string;

    /** 문을 마지막으로 연 시각 — 한국 시각 yyyyMMddHHmmss(방금 바로 열기를 한 시각) */
    door_opened_at: string;
}
