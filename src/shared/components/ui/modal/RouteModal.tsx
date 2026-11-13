'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

type RouteModalProps = {
    title: string;
    footer?: React.ReactNode;
    children: React.ReactNode;
};

/**
 * 경로 모달 — src/app/@modal/(.)<주소>/page.tsx 에서 감싼다
 * - 닫으면 router.back() 으로 아래 화면 주소로 돌아간다 — 빠르게 여러 번 눌러도 한 번만
 * - 같은 주소의 보통 페이지(src/app/<주소>/page.tsx)가 새로고침 · 직접 접속을 맡는다
 *
 * @param param0
 * @returns
 */
export default function RouteModal({title, footer, children}: RouteModalProps): React.ReactNode {
    // 변수
    const router = useRouter();                // 닫을 때 뒤로 가기
    const closingRef = useRef<boolean>(false); // 이미 닫는 중인지 — 뒤로 가기를 두 번 하지 않게

    // 함수
    function close(): void {
        if (closingRef.current) {
            return;
        }

        closingRef.current = true;
        router.back();
    }

    return (
        // 늘 열린 모달 — 닫으면 아래 화면 주소로
        <Modal open title={title} footer={footer} onClose={close}>
            {/* 화면 내용 */}
            {children}
        </Modal>
    );
}
