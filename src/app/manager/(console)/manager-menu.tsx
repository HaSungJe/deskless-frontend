import { AUTH_ID } from '@/contracts/common/roles';
import { ConsoleMenuItemType } from '@/shared/components/console/console-menu';

/** 업체 관리자 메뉴 — 시안 콘솔 틀 순서 · 아이콘(frontend/design/manager.html:275-281), 업체 관리자는 업체 총관리자만, 문의는 시안 밖(frontend/changes/2026-11-24-inquiry.md — 업체 관리자 모두) */
export const MANAGER_MENU: ReadonlyArray<ConsoleMenuItemType> = [
    {href: '/manager/', label: '대시보드', exact: true, icon: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>},
    {href: '/manager/reservations/', label: '예약 현황', icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>},
    {href: '/manager/inquiries/', label: '문의', icon: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z" /><path d="M8.5 10.5h7M8.5 14h4.5" /></>},
    {href: '/manager/rooms/', label: '호실', icon: <><path d="M6 21V4h12v17M4 21h16" /><path d="M14.5 12.5h.01" /></>},
    {href: '/manager/room-groups/', label: '객실 그룹', icon: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>},
    {href: '/manager/plans/', label: '상품 설정', icon: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>},
    {href: '/manager/store/', label: '내 업체 설정', icon: <><path d="M4 10v10h16V10" /><path d="M3 10 5 4h14l2 6H3z" /><path d="M10 20v-5h4v5" /></>},
    {href: '/manager/staff/', label: '업체 관리자', roles: [AUTH_ID.HEAD_MANAGER], icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></>},
];
