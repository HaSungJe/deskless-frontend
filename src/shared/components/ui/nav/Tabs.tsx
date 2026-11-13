import Link from 'next/link';
import styles from '@/shared/css/ui/nav/Tabs.module.css';

export type TabItemType<T extends string> = {
    value: T;
    label: string;
    href?: string; // 있으면 링크 탭(주소가 바뀜), 없으면 버튼 탭(onChange)
};

type TabsProps<T extends string> = {
    items: Array<TabItemType<T>>;
    value: T;
    onChange?: (value: T) => void;
    label: string; // 탭 묶음 이름 (aria-label)
};

/**
 * 탭 — 지금 탭은 aria-current
 *
 * @param param0
 * @returns
 */
export default function Tabs<T extends string>({items, value, onChange, label}: TabsProps<T>): React.ReactNode {
    // 함수
    function select(item: TabItemType<T>): void {
        if (item.value !== value) {
            onChange?.(item.value);
        }
    }

    return (
        // 탭 묶음
        <nav aria-label={label} className={styles.tabs}>
            {/* 탭 — href 가 있으면 링크 탭, 없으면 버튼 탭 */}
            {items.map((item) => item.href ? (
                <Link
                    key={item.value}
                    href={item.href}
                    className={styles.tab}
                    aria-current={item.value === value ? 'page' : undefined}
                >
                    {item.label}
                </Link>
            ) : (
                <button
                    key={item.value}
                    type="button"
                    className={styles.tab}
                    aria-current={item.value === value ? 'true' : undefined}
                    onClick={() => select(item)}
                >
                    {item.label}
                </button>
            ))}
        </nav>
    );
}
