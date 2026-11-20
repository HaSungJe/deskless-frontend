import RoomGroupListContent from './RoomGroupListContent';

// M5 객실 그룹 목록 — /manager/room-groups (콘솔 틀 · 매니저 로그인 필요 — layout 이 감싼다)
export default function RoomGroups(): React.ReactNode {
    return (
        // 객실 그룹 목록
        <RoomGroupListContent />
    );
}
