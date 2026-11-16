import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        tsconfigPaths: true, // @/* → src/*
    },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
        setupFiles: ['./vitest.setup.ts'],
        env: {
            __NEXT_TRAILING_SLASH: 'true', // next.config.ts trailingSlash 와 같게 — next build 가 넣는 값이라 테스트에서는 직접(없으면 next/link 가 끝 / 를 뗀다)
        },
    },
});
