'use client';
import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import { showErrorPopup } from '@/shared/utils/error-popup';

type CopyButtonProps = {
    text: string;          // 복사할 글자 (예: 업체 로그인 주소)
    label?: string;        // 기본 '복사'
    size?: 'md' | 'sm' | 'lg';
};

const COPIED_MS: number = 2000;

/**
 * 복사 버튼 — 누르면 클립보드에 넣고 잠깐 "복사됨"
 *
 * @param param0
 * @returns
 */
export default function CopyButton({text, label = '복사', size = 'sm'}: CopyButtonProps): React.ReactNode {
    // 변수
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // "복사됨" 을 되돌리는 타이머

    // 상태
    const [copied, setCopied] = useState<boolean>(false); // 방금 복사했는지

    // 효과
    useEffect(() => {
        // 사라질 때 타이머 정리
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    // 함수
    async function copy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => setCopied(false), COPIED_MS);
        } catch {
            // http 같은 비보안 주소에서는 navigator.clipboard 가 없다
            showErrorPopup('복사하지 못했습니다. 직접 선택해 복사해 주세요.');
        }
    }

    return (
        // 복사 버튼 — 복사하면 잠깐 "복사됨"
        <Button size={size} onClick={copy} aria-live="polite">
            {copied ? '복사됨' : label}
        </Button>
    );
}
