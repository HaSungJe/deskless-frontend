import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import RoomsContent from '@/app/manager/(console)/rooms/RoomsContent';
import { ROOM_GROUP_ID, ROOM_ID, roomGroupList, roomList } from '../room-fixture';
import { renderWithManager } from '../store/store-fixture';

const api = vi.hoisted(() => ({
    getRooms: vi.fn(),
    getRoomGroups: vi.fn(),
    createRoom: vi.fn(),
    updateRoom: vi.fn(),
    deleteRoom: vi.fn(),
    openRoomDoor: vi.fn(),
    updateRoomState: vi.fn(),
}));

vi.mock('@/contracts/room/api', () => api);

/**
 * 화면을 그리고 호실 목록 · 그룹 전체를 기다린다
 */
async function renderRooms(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderWithManager(<RoomsContent />);
    });
    return container;
}

/**
 * 호실 등록 대화상자를 열어 칸을 채운다
 *
 * @param floor 층 칸 글자
 */
function fillCreate(floor: string): ReturnType<typeof within> {
    fireEvent.click(screen.getByRole('button', {name: '호실 등록'}));
    const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
    fireEvent.change(dialog.getByLabelText(/객실 그룹/), {target: {value: ROOM_GROUP_ID}});
    fireEvent.change(dialog.getByLabelText(/호실명/), {target: {value: ' 302호 '}});
    fireEvent.change(dialog.getByLabelText(/층/), {target: {value: floor}});
    return dialog;
}

beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getRooms.mockResolvedValue(roomList());
    api.getRoomGroups.mockResolvedValue(roomGroupList());
    api.createRoom.mockResolvedValue({room_id: 'n'.repeat(32)});
    api.openRoomDoor.mockResolvedValue({room_id: ROOM_ID, door_opened_at: '20261120090512'});
});

describe('RoomsContent', () => {
    it('[SUCCESS] 호실을 등록한다 → 등록(큐) 1번(그룹 ID · 호실명 · 층 숫자) → 대화상자 닫힘 → 목록 다시', async () => {
        await renderRooms();
        expect(api.getRooms).toHaveBeenCalledTimes(1);
        expect({...api.getRooms.mock.calls[0][1]}).toMatchObject({page: 1, size: 20, floor: null, room_group_id: null});
        expect(screen.getByRole('option', {name: 'B1'})).toBeTruthy();

        const dialog = fillCreate('3');
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '등록'}));
        });

        expect(api.createRoom).toHaveBeenCalledTimes(1);
        expect(api.createRoom.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(JSON.parse(JSON.stringify(api.createRoom.mock.calls[0][1]))).toEqual({room_group_id: ROOM_GROUP_ID, room_name: '302호', floor: 3});
        expect(document.querySelector('dialog[open]')).toBeNull();
        expect(api.getRooms).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:validation] 층을 300 으로 등록한다 → 칸 옆 "층은 -10 ~ 200 사이로 입력해주세요.", 등록 0번', async () => {
        const container = await renderRooms();

        const dialog = fillCreate('300');
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '등록'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="floor"]') as HTMLElement).innerText).toBe('층은 -10 ~ 200 사이로 입력해주세요.');
        expect(api.createRoom).not.toHaveBeenCalled();
        expect(api.getRooms).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] 문을 연다 → 문 바로 열기 1번(그 호실) → 그 줄 시각이 받은 시각으로, 목록은 다시 부르지 않음', async () => {
        await renderRooms();
        const row = screen.getByText('301호').closest('tr') as HTMLElement;
        expect(within(row).getByText('-')).toBeTruthy();

        await act(async () => {
            fireEvent.click(within(row).getByRole('button', {name: '문 열기'}));
        });

        expect(api.openRoomDoor).toHaveBeenCalledTimes(1);
        expect(api.openRoomDoor.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.openRoomDoor.mock.calls[0][1]).toBe(ROOM_ID);
        expect(within(row).getByText('2026-11-20 09:05')).toBeTruthy();
        expect(api.getRooms).toHaveBeenCalledTimes(1);
    });
});
