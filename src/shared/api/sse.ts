/** SSE 이벤트 하나 */
export type SseEventType = {
    event: string; // 이벤트 이름 — event: 줄 (없으면 'message')
    data: string;  // data: 줄들을 \n 으로 이은 값 (없으면 '')
};

/** takeSseEvents 결과 */
export type SseTakeResultType = {
    events: Array<SseEventType>; // 끝까지 온 이벤트
    rest: string;                // 아직 끝나지 않은 꼬리 — 다음 조각을 이어 붙인다
};

/**
 * SSE 버퍼에서 끝난 이벤트를 꺼낸다 — 경계는 빈 줄(\n\n · CRLF 도 허용), ':' 로 시작하는 줄은 주석
 * - 끝이 \r 로 잘린 버퍼는 그 \r 을 꼬리에 남긴다(다음 조각의 \n 과 합쳐 경계로 잘못 읽지 않게)
 *
 * @param buffer 지금까지 받은 문자열(이전 rest + 새 조각)
 */
export function takeSseEvents(buffer: string): SseTakeResultType {
    const holdCr = buffer.endsWith('\r');
    const normalized = (holdCr ? buffer.slice(0, -1) : buffer).replace(/\r\n?/g, '\n');
    const blocks = normalized.split('\n\n');
    const rest = (blocks.pop() ?? '') + (holdCr ? '\r' : '');

    const events: Array<SseEventType> = [];
    for (const block of blocks) {
        const event = parseSseBlock(block);
        if (event) {
            events.push(event);
        }
    }

    return {events, rest};
}

/**
 * 이벤트 블록 하나 읽기 — event · data 줄이 하나도 없으면 null(주석만 있는 블록)
 *
 * @param block 빈 줄로 나뉜 블록
 */
function parseSseBlock(block: string): SseEventType | null {
    let event = 'message';
    let hasField = false;
    const dataLines: Array<string> = [];

    for (const line of block.split('\n')) {
        if (line === '' || line.startsWith(':')) {
            continue;
        }

        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        const raw = colon === -1 ? '' : line.slice(colon + 1);
        const value = raw.startsWith(' ') ? raw.slice(1) : raw;

        if (field === 'event') {
            event = value;
            hasField = true;
        } else if (field === 'data') {
            dataLines.push(value);
            hasField = true;
        }
    }

    return hasField ? {event, data: dataLines.join('\n')} : null;
}
