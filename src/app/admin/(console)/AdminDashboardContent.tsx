'use client';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import styles from '@/app/css/admin/AdminDashboardContent.module.css';

/**
 * A2 대시보드 자리 — Phase 17 에서 통계 화면으로 바뀐다. 그때까지 준비 중 안내만(spec 결정)
 *
 * @returns
 */
export default function AdminDashboardContent(): React.ReactNode {
    return (
        // 대시보드
        <div className={styles.page}>
            {/* 제목 */}
            <h1 className={styles.title}>대시보드</h1>

            {/* ④ 준비 중 */}
            <EmptyState title="대시보드는 준비 중이에요" description="입점 신청 · 업체 · 업체 관리자 · 이용자 화면도 차례로 열립니다." />
        </div>
    );
}
