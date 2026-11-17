// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { transformSync } from '@babel/core';
import reactCompiler, { LoggerEvent } from 'babel-plugin-react-compiler';
import { describe, expect, it } from 'vitest';

/** 검사할 코드 — src 아래(테스트 제외) */
const SOURCE_ROOT = path.resolve(__dirname, '..');
const TEST_ROOT = path.resolve(__dirname);

/**
 * 컴포넌트 · 훅 파일 — .tsx 전부와 use*.ts
 *
 * @param dir 찾을 폴더
 */
function componentFiles(dir: string): Array<string> {
    return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return full === TEST_ROOT ? [] : componentFiles(full);
        }

        return entry.name.endsWith('.tsx') || /^use[A-Z].*\.ts$/.test(entry.name) ? [full] : [];
    });
}

/**
 * React Compiler 가 건너뛴 함수 — "파일:줄 이유"
 *
 * @param file 파일 경로
 */
function skippedFunctions(file: string): Array<string> {
    const events: Array<LoggerEvent> = [];
    transformSync(fs.readFileSync(file, 'utf8'), {
        filename: file,
        babelrc: false,
        configFile: false,
        parserOpts: {plugins: file.endsWith('.tsx') ? ['typescript', 'jsx'] : ['typescript']},
        plugins: [[reactCompiler, {logger: {logEvent: (_filename: string | null, event: LoggerEvent) => events.push(event)}}]],
    });

    const relative = path.relative(SOURCE_ROOT, file).replaceAll('\\', '/');
    return events.flatMap((event) => {
        if (event.kind === 'CompileError') {
            return [`${relative}:${event.fnLoc?.start.line ?? '?'} ${(event.detail as {reason?: string}).reason ?? String(event.detail)}`];
        }

        return event.kind === 'PipelineError' ? [`${relative}:${event.fnLoc?.start.line ?? '?'} ${event.data}`] : [];
    });
}

describe('React Compiler', () => {
    it('[SUCCESS] 모든 컴포넌트 · 훅이 컴파일된다 — 건너뛰면 메모가 빠져 렌더마다 자식 · 효과가 다시 돈다(docs/conventions.md "React Compiler 가 건너뛰는 모양")', () => {
        const files = componentFiles(SOURCE_ROOT);

        expect(files.length).toBeGreaterThan(0);
        expect(files.flatMap(skippedFunctions)).toEqual([]);
    }, 120_000);
});
