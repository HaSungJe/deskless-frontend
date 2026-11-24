import { ConsoleMenuItemType } from '@/shared/components/console/console-menu';

/** 관리자 메뉴 — 시안 콘솔 틀 순서 · 아이콘(frontend/design/admin.html A2), 총괄관리자 · 관리자 같은 메뉴(admin.html:260), 문의는 시안 밖(frontend/changes/2026-11-24-inquiry.md) */
export const ADMIN_MENU: ReadonlyArray<ConsoleMenuItemType> = [
    {href: '/admin/', label: '대시보드', exact: true, icon: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>},
    {href: '/admin/store-applications/', label: '입점 신청', icon: <><path d="M9 3.5h6v3H9z" /><path d="M9 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H15" /><path d="m9 14 2 2 4-4" /></>},
    {href: '/admin/stores/', label: '업체', icon: <><path d="M4 10v10h16V10" /><path d="M3 10l2-6h14l2 6z" /><path d="M10 20v-5h4v5" /></>},
    {href: '/admin/managers/', label: '업체 관리자', icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 5h5M16 9h5M18 13h3" /></>},
    {href: '/admin/users/', label: '이용자', icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14.5c2.4 0 4 1.6 4.5 4.5" /></>},
    {href: '/admin/inquiries/', label: '문의', icon: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z" /><path d="M8.5 10.5h7M8.5 14h4.5" /></>},
];
