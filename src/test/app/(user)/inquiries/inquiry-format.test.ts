// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { inquiryTargetName } from '@/app/(user)/inquiries/inquiry-format';
import { SITE_NAME } from '@/shared/utils/site';

describe('inquiryTargetName — 문의 대상 이름', () => {
    it('[SUCCESS] 업체에 한 문의는 상호명이 보인다', () => {
        expect(inquiryTargetName('바로방 강남역점')).toBe('바로방 강남역점');
    });

    it('[SUCCESS] 업체가 없는 문의는 서비스 이름이 보인다', () => {
        expect(inquiryTargetName(null)).toBe(SITE_NAME);
        expect(SITE_NAME).toBe('바로방');
    });
});
