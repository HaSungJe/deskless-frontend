import 'reflect-metadata'; // 지침서 DTO 의 @Type(class-transformer)이 부른다 — 앱은 src/instrumentation.ts · instrumentation-client.ts 가 붙인다
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom 에는 CSS.escape 가 없다 — 오류 칸 선택자(src/shared/utils/validation.ts)가 쓴다. 테스트용 간단 대체(영문 · 숫자 · _ · - 밖의 글자 앞에 \)
if (typeof globalThis.CSS === 'undefined' || typeof globalThis.CSS.escape !== 'function') {
    Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: {escape: (value: string): string => String(value).replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)},
    });
}

// 테스트마다 렌더한 DOM 을 지운다 (globals 를 켜지 않아 Testing Library 자동 cleanup 이 등록되지 않는다)
afterEach(() => {
    cleanup();
});
