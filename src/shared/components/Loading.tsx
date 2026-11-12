import { ClipLoader } from 'react-spinners';

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
    if (process.env.NEXT_PUBLIC_LOADING !== '1') {
        return null;
    }

    const style: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: `${height}vh`,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        flexDirection: 'column',
    };

    return (
        <div style={style}>
            <ClipLoader
                size={size}
                color="#15B06F"
                loading
            />
        </div>
    );
}
