// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { floorLabel } from '@/app/manager/(console)/room-display';

describe('floorLabel — 층 이름', () => {
    it('[SUCCESS] 지상 층은 "층"을 붙인다', () => {
        expect(floorLabel(3)).toBe('3층');
    });

    it('[SUCCESS] 지하 층은 B 를 붙인다', () => {
        expect(floorLabel(-1)).toBe('B1');
    });
});
