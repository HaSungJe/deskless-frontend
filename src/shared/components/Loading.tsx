import { ClipLoader } from 'react-spinners';
import styles from '@/shared/css/Loading.module.css';

type LoadingProps = {
    size?: number;
    height?: number;
}

/**
 * 로딩 표시 — NEXT_PUBLIC_LOADING 이 '1' 일 때만 보인다
 *
 * @param param0
 * @returns
 */
export default function Loading({size = 150, height = 100}: LoadingProps): React.ReactNode {
    // 변수
    const visible = process.env.NEXT_PUBLIC_LOADING === '1'; // 로딩 표시를 켰는지

    if (!visible) {
        return null;
    }

    return (
        // 로딩 — 가운데 스피너
        <div className={styles.loading} style={{height: `${height}vh`}}>
            {/* 스피너 */}
            <ClipLoader size={size} color="var(--primary)" loading />
        </div>
    );
}
