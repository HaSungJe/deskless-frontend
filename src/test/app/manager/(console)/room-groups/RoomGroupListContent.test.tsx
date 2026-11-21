import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import RoomGroupListContent from '@/app/manager/(console)/room-groups/RoomGroupListContent';
import { roomGroupList } from '../room-fixture';
import { renderWithManager } from '../store/store-fixture';

const {getRoomGroups, createRoomGroup, push} = vi.hoisted(() => ({
    getRoomGroups: vi.fn(),
    createRoomGroup: vi.fn(),
    push: vi.fn(),
}));

vi.mock('@/contracts/room/api', () => ({getRoomGroups, createRoomGroup}));
vi.mock('next/navigation', () => ({useRouter: () => ({push})}));

/** 등록된 그룹 ID */
const CREATED_ID = 'c'.repeat(32);

/**
 * 화면을 그리고 첫 목록을 기다린다
 */
async function renderList(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderWithManager(<RoomGroupListContent />);
    });
    return container;
}

/**
 * 그룹 등록 대화상자를 연다
 */
function openCreate(): ReturnType<typeof within> {
    fireEvent.click(screen.getByRole('button', {name: '그룹 등록'}));
    return within(document.querySelector('dialog[open]') as HTMLElement);
}

beforeEach(() => {
    getRoomGroups.mockReset().mockResolvedValue(roomGroupList());
    createRoomGroup.mockReset().mockResolvedValue({room_group_id: CREATED_ID});
    push.mockClear();
});

describe('RoomGroupListContent', () => {
    it('[SUCCESS] 그룹을 등록한다 → 등록(큐) 1번(그룹명 · 설명 · 방 개수 · 객실 옵션) → 받은 그룹 상세 주소로 이동', async () => {
        await renderList();
        expect(getRoomGroups).toHaveBeenCalledTimes(1);
        expect(screen.getByText('디럭스 트윈')).toBeTruthy();

        const dialog = openCreate();
        fireEvent.change(dialog.getByLabelText(/그룹명/), {target: {value: ' 스위트 시티뷰 '}});
        fireEvent.change(dialog.getByLabelText('설명'), {target: {value: '창가 객실'}});
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '등록'}));
        });

        expect(createRoomGroup).toHaveBeenCalledTimes(1);
        expect(createRoomGroup.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(JSON.parse(JSON.stringify(createRoomGroup.mock.calls[0][1]))).toEqual({room_group_name: '스위트 시티뷰', description: '창가 객실', room_group_detail: {room_count: 1, has_shower: 1, has_tv: 1, has_pc: 1}});
        expect(push).toHaveBeenCalledTimes(1);
        expect(push).toHaveBeenCalledWith(`/manager/room-groups/${CREATED_ID}/`);
    });

    it('[FAIL:validation] 그룹명을 비우고 등록한다 → 칸 옆 "그룹명을 입력해주세요.", 등록 0번', async () => {
        const container = await renderList();

        const dialog = openCreate();
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '등록'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="room_group_name"]') as HTMLElement).innerText).toBe('그룹명을 입력해주세요.');
        expect(createRoomGroup).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });
});
