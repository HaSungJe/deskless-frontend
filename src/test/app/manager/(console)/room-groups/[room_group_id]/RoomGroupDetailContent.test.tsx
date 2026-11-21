import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import RoomGroupDetailContent from '@/app/manager/(console)/room-groups/[room_group_id]/RoomGroupDetailContent';
import { planPrices, ROOM_GROUP_ID, roomGroupDetail } from '../../room-fixture';
import { renderWithManager } from '../../store/store-fixture';

const api = vi.hoisted(() => ({
    getRoomGroup: vi.fn(),
    updateRoomGroup: vi.fn(),
    deleteRoomGroup: vi.fn(),
    updateRoomGroupPlan: vi.fn(),
    getRoomGroupPlanPrices: vi.fn(),
    createRoomGroupPlanPrice: vi.fn(),
    updateRoomGroupPlanPrice: vi.fn(),
    deleteRoomGroupPlanPrice: vi.fn(),
    issueRoomGroupImageUrl: vi.fn(),
    registerRoomGroupImage: vi.fn(),
    reorderRoomGroupImages: vi.fn(),
    deleteRoomGroupImage: vi.fn(),
}));
const {push} = vi.hoisted(() => ({push: vi.fn()}));

vi.mock('@/contracts/room/api', () => api);
vi.mock('next/navigation', () => ({useRouter: () => ({push})}));
// 사진 부품은 그리지 않는다 — 끌기(dnd)를 jsdom 에서 그리지 않는다(사진 흐름은 내 업체 사진 탭 테스트)
vi.mock('@/shared/components/upload/ImageUploader', () => ({default: () => <div />}));

/**
 * 화면을 그리고 상세 · 기간 가격 목록을 기다린다
 */
async function renderDetail(): Promise<HTMLElement> {
    let container: HTMLElement = document.body;
    await act(async () => {
        container = renderWithManager(<RoomGroupDetailContent roomGroupId={ROOM_GROUP_ID} />);
    });
    return container;
}

beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    api.getRoomGroup.mockResolvedValue(roomGroupDetail());
    api.getRoomGroupPlanPrices.mockResolvedValue(planPrices());
    api.updateRoomGroup.mockResolvedValue(null);
    api.updateRoomGroupPlan.mockResolvedValue(null);
    api.deleteRoomGroup.mockResolvedValue(null);
    push.mockClear();
});

describe('RoomGroupDetailContent', () => {
    it('[SUCCESS] 기본 정보를 고쳐 저장한다 → 수정(큐) 1번(그룹명 · 설명 · 방 개수 · 객실 옵션 0 · 1) → 상세 다시', async () => {
        await renderDetail();
        expect(api.getRoomGroup).toHaveBeenCalledTimes(1);
        expect(screen.getByText('호실 2개(301호 · 302호) · 등록 2026-03-02 · 수정 2026-11-08 16:20')).toBeTruthy();

        fireEvent.change(screen.getByLabelText(/그룹명/), {target: {value: '디럭스 트윈 A'}});
        fireEvent.change(screen.getByLabelText('방 개수'), {target: {value: '2'}});
        fireEvent.click(screen.getByRole('switch', {name: 'PC'}));
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '기본 정보 저장'}));
        });

        expect(api.updateRoomGroup).toHaveBeenCalledTimes(1);
        expect(api.updateRoomGroup.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.updateRoomGroup.mock.calls[0][1]).toBe(ROOM_GROUP_ID);
        expect(JSON.parse(JSON.stringify(api.updateRoomGroup.mock.calls[0][2]))).toEqual({room_group_name: '디럭스 트윈 A', description: '싱글 침대 2개와 욕조가 있는 트윈 객실입니다.', room_group_detail: {room_count: 2, has_shower: 1, has_tv: 1, has_pc: 1}});
        expect(api.getRoomGroup).toHaveBeenCalledTimes(2);
    });

    it('[FAIL:validation] 방 개수를 0 으로 저장한다 → 칸 옆 "방 개수는 1 ~ 20 사이로 입력해주세요.", 수정 0번', async () => {
        const container = await renderDetail();

        fireEvent.change(screen.getByLabelText('방 개수'), {target: {value: '0'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '기본 정보 저장'}));
        });

        expect((container.querySelector('[data-type="validation-alert"][data-id="room_count"][data-key="room_group_detail"]') as HTMLElement).innerText).toBe('방 개수는 1 ~ 20 사이로 입력해주세요.');
        expect(api.updateRoomGroup).not.toHaveBeenCalled();
        expect(api.getRoomGroup).toHaveBeenCalledTimes(1);
    });

    it('[SUCCESS] 1박을 판매로 켜고 요금을 넣어 저장한다 → 그룹 상품 수정(큐) 1번(1박 — 판매 1 · 요금) → 상세 다시', async () => {
        await renderDetail();

        fireEvent.click(screen.getByRole('switch', {name: '1박 판매'}));
        fireEvent.change(screen.getByLabelText('1박 기본 요금'), {target: {value: '59000'}});
        await act(async () => {
            fireEvent.click(screen.getByRole('button', {name: '1박 저장'}));
        });

        expect(api.updateRoomGroupPlan).toHaveBeenCalledTimes(1);
        expect(api.updateRoomGroupPlan.mock.calls[0][0]).toMatchObject({token: 'manager-token'});
        expect(api.updateRoomGroupPlan.mock.calls[0].slice(1, 3)).toEqual([ROOM_GROUP_ID, 'NIGHT']);
        expect(JSON.parse(JSON.stringify(api.updateRoomGroupPlan.mock.calls[0][3]))).toEqual({is_used: 1, price: 59000});
        expect(api.getRoomGroup).toHaveBeenCalledTimes(2);
    });

    it('[SUCCESS] 그룹을 지운다 → 확인 뒤 삭제(큐) 1번 → 객실 그룹 목록으로 이동', async () => {
        await renderDetail();

        fireEvent.click(screen.getByRole('button', {name: '그룹 삭제'}));
        const dialog = within(document.querySelector('dialog[open]') as HTMLElement);
        expect(dialog.getByText('디럭스 트윈 그룹을 삭제할까요? 그룹의 호실 · 사진도 함께 지워집니다.')).toBeTruthy();
        await act(async () => {
            fireEvent.click(dialog.getByRole('button', {name: '삭제'}));
        });

        expect(api.deleteRoomGroup).toHaveBeenCalledTimes(1);
        expect(api.deleteRoomGroup.mock.calls[0].slice(1)).toEqual([ROOM_GROUP_ID]);
        expect(push).toHaveBeenCalledTimes(1);
        expect(push).toHaveBeenCalledWith('/manager/room-groups/');
    });
});
