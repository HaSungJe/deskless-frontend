// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { takeSseEvents } from '@/shared/api/sse';

describe('takeSseEvents', () => {
    it('[SUCCESS] 이벤트 하나를 꺼내고 꼬리는 비운다', () => {
        const result = takeSseEvents('event: done\ndata: {"id":1}\n\n');

        expect(result.events).toEqual([{event: 'done', data: '{"id":1}'}]);
        expect(result.rest).toBe('');
    });

    it('[SUCCESS] 한 버퍼의 두 이벤트를 순서대로 꺼낸다', () => {
        const result = takeSseEvents('event: accepted\ndata: {"request_id":"r1"}\n\nevent: done\ndata: null\n\n');

        expect(result.events).toEqual([
            {event: 'accepted', data: '{"request_id":"r1"}'},
            {event: 'done', data: 'null'},
        ]);
        expect(result.rest).toBe('');
    });

    it('[SUCCESS] 끝나지 않은 꼬리는 rest 로 남긴다', () => {
        const result = takeSseEvents('event: accepted\ndata: {}\n\nevent: do');

        expect(result.events).toEqual([{event: 'accepted', data: '{}'}]);
        expect(result.rest).toBe('event: do');
    });

    it('[SUCCESS] CRLF 줄바꿈도 이벤트 경계로 읽는다', () => {
        const result = takeSseEvents('event: done\r\ndata: null\r\n\r\n');

        expect(result.events).toEqual([{event: 'done', data: 'null'}]);
        expect(result.rest).toBe('');
    });

    it('[SUCCESS] data 가 여러 줄이면 \\n 으로 이어 한 값으로 만든다', () => {
        const result = takeSseEvents('event: failed\ndata: {"a":\ndata: 1}\n\n');

        expect(result.events).toEqual([{event: 'failed', data: '{"a":\n1}'}]);
        expect(result.rest).toBe('');
    });

    it('[SUCCESS] 주석만 있는 블록은 이벤트로 치지 않는다', () => {
        const result = takeSseEvents(': ping\n\n');

        expect(result.events).toEqual([]);
        expect(result.rest).toBe('');
    });

    it('[SUCCESS] data 줄이 없으면 data 는 빈 문자열', () => {
        const result = takeSseEvents('event: pending\n\n');

        expect(result.events).toEqual([{event: 'pending', data: ''}]);
        expect(result.rest).toBe('');
    });
});
