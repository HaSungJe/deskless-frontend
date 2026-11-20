import RoomGroupDetailContent from './RoomGroupDetailContent';

// M5 객실 그룹 상세 — /manager/room-groups/[room_group_id] (콘솔 틀 · 매니저 로그인 필요 — layout 이 감싼다)
export default async function RoomGroupDetail({params}: PageProps<'/manager/room-groups/[room_group_id]'>): Promise<React.ReactNode> {
    const {room_group_id} = await params;

    return (
        // 객실 그룹 상세
        <RoomGroupDetailContent roomGroupId={room_group_id} />
    );
}
