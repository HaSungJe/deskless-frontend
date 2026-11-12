import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 테스트마다 렌더한 DOM 을 지운다 (globals 를 켜지 않아 Testing Library 자동 cleanup 이 등록되지 않는다)
afterEach(() => {
    cleanup();
});
