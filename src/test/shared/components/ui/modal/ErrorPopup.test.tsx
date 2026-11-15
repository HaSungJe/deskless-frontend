import { afterEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ErrorPopup from '@/shared/components/ui/modal/ErrorPopup';
import { closeErrorPopup, showErrorPopup } from '@/shared/utils/error-popup';

afterEach(() => {
    act(() => {
        closeErrorPopup();
    });
});

describe('ErrorPopup', () => {
    it('[SUCCESS] showErrorPopup 으로 열리고 확인을 누르면 닫힌다', () => {
        render(<ErrorPopup />);
        expect(screen.queryByText('업체명을 입력해 주세요.')).toBeNull();

        act(() => {
            showErrorPopup('업체명을 입력해 주세요.');
        });
        expect(screen.getByText('업체명을 입력해 주세요.')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', {name: '확인'}));
        expect(screen.queryByText('업체명을 입력해 주세요.')).toBeNull();
    });

    it('[SUCCESS] 열린 채 새 오류가 오면 새 문구로 바뀌고 개발 원문도 보인다', () => {
        render(<ErrorPopup />);

        act(() => {
            showErrorPopup('첫 오류');
        });
        act(() => {
            showErrorPopup('둘째 오류', 'TypeError: boom');
        });

        expect(screen.queryByText('첫 오류')).toBeNull();
        expect(screen.getByText('둘째 오류')).toBeTruthy();
        expect(screen.getByText('TypeError: boom')).toBeTruthy();
    });
});
