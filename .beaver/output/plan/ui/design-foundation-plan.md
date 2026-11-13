# Plan — 디자인 기반 (Phase 1)

## Feature Summary
- **Feature**: 시안의 색 · 글꼴 · 크기를 전역 토큰으로, 공통 UI 부품과 경로 모달 규칙을 코드로
- **Entry point**: `PAGE /dev/ui · /dev/ui/modal-demo (개발 전용) · src/shared/components/ui/*`
- **Domain**: ui
- **Spec**: `.beaver/output/spec/ui/design-foundation-spec.md` · roadmap Phase 1 (#1 디자인 토큰 · 전역 CSS · 글꼴, #2 공통 UI 컴포넌트)
- **구조 규칙(memory 우선)**: `.beaver/memory/conventions.md` — 컴포넌트 · 훅 본문은 변수 > 상태 > 계산 값 > 효과 > 함수 > JSX, 영역 빈 줄 · 영역 한 줄 주석 · 변수/상태/계산 값 오른쪽 역할 주석 · JSX 덩어리 주석. 이 plan 의 새 코드와 고치는 파일(Loading · RootLayoutContent · layout)에 적용한다.

---

## File List

| File | Action |
|------|------|
| `src/app/globals.css` | new — 색 · 크기 토큰, 기본 스타일 |
| `src/app/layout.tsx` | modified — `globals.css` · Noto Sans KR · `modal` 슬롯 |
| `src/app/RootLayoutContent.tsx` | modified — `modal` 그리기 · 진행 막대 색 · 구조 규칙 |
| `src/app/@modal/default.tsx` | new — 슬롯 기본(null) |
| `src/app/@modal/[...catchAll]/page.tsx` | new — 다른 주소로 가면 팝업 지우기(null) |
| `src/app/@modal/(.)dev/ui/modal-demo/page.tsx` | new — 경로 모달 예시(가로채기) |
| `src/app/dev/ui/page.tsx` | new — 미리보기(개발 전용) |
| `src/app/dev/ui/modal-demo/page.tsx` | new — 경로 모달 예시(보통 페이지) |
| `src/app/dev/ui/UiPreviewContent.tsx` | new |
| `src/app/dev/ui/UiPreviewContent.module.css` | new |
| `src/app/dev/ui/modal-demo/ModalDemoContent.tsx` | new |
| `src/shared/components/ui/Button.tsx` · `Button.module.css` | new |
| `src/shared/components/ui/Input.tsx` · `Input.module.css` | new |
| `src/shared/components/ui/Textarea.tsx` | new (스타일은 `Input.module.css`) |
| `src/shared/components/ui/Field.tsx` · `Field.module.css` | new |
| `src/shared/components/ui/Badge.tsx` · `Badge.module.css` | new |
| `src/shared/components/ui/Band.tsx` · `Band.module.css` | new |
| `src/shared/components/ui/Switch.tsx` · `Switch.module.css` | new |
| `src/shared/components/ui/Chip.tsx` · `Chip.module.css` | new |
| `src/shared/components/ui/Segmented.tsx` · `Segmented.module.css` | new |
| `src/shared/components/ui/Tabs.tsx` · `Tabs.module.css` | new |
| `src/shared/components/ui/Card.tsx` · `Card.module.css` | new |
| `src/shared/components/ui/Table.tsx` · `Table.module.css` | new |
| `src/shared/components/ui/EmptyState.tsx` · `EmptyState.module.css` | new |
| `src/shared/components/ui/Modal.tsx` · `Modal.module.css` | new |
| `src/shared/components/ui/ConfirmModal.tsx` | new |
| `src/shared/components/ui/ReasonModal.tsx` · `ReasonModal.module.css` | new |
| `src/shared/components/ui/ReasonModal.test.tsx` | new |
| `src/shared/components/ui/RouteModal.tsx` | new |
| `src/shared/components/ui/CopyButton.tsx` | new |
| `src/shared/components/Loading.tsx` | modified — 초록 인라인 스타일 → 토큰 · CSS Module · 구조 규칙 |
| `src/shared/components/Loading.module.css` | new |
| `src/shared/utils/validation.ts` | modified — 오류 글자색 `'red'` → `var(--danger)` |
| `src/shared/components/Pagination.tsx` | unchanged — 모양은 Phase 2 #4 에서 |
| `src/app/(user)/login/LoginContent.tsx` | unchanged — 예전 오류 span 은 그대로 동작 |

---

## Design

### 디자인 토큰 · 글꼴 (#1)

색은 세 시안(`frontend/design/*.html` `:root`)의 같은 값을 콘솔 이름으로 한 벌, 이용자 전용 색만 더한다. 크기는 기본 이용자, `[data-area="console"]` 이 콘솔.

```css
/* src/app/globals.css — 디자인 토큰 (시안 frontend/design/*.html 의 :root, 밝은 화면 한 벌) */
:root {
    color-scheme: light;

    /* 색 — 세 영역 공통 (이름은 콘솔 시안 기준) */
    --bg: #F4F5F7;
    --surface: #FFFFFF;
    --surface-2: #F9FAFB;
    --line: #E2E5EA;
    --fg: #15171A;
    --muted: #5A6170;
    --faint: #6B7280;
    --primary: #2457D6;
    --primary-strong: #1C46AE;
    --primary-soft: #E8EEFC;
    --on-primary: #FFFFFF;
    --ok: #1C7A4B;
    --ok-soft: #E6F4EC;
    --warn: #A85A00;
    --warn-soft: #FDF1E2;
    --danger: #C0362C;
    --danger-soft: #FBE9E7;
    --neutral-fg: #4B5260;
    --neutral-bg: #EEF0F3;
    --scrim: rgba(21, 23, 26, 0.45);
    --shadow: 0 1px 2px rgba(21, 23, 26, 0.06);

    /* 색 — 이용자 전용 */
    --map-bg: #EEF1F5;
    --map-grid: #DCE2EA;
    --map-water: #D6E3F3;
    --kakao: #FEE500;
    --naver: #03C75A;
    --primary-halo: rgba(36, 87, 214, 0.18);
    --frame-shadow: 0 8px 28px rgba(21, 23, 26, 0.10);

    /* 글꼴 — --font-noto-sans-kr 는 layout.tsx 의 next/font 가 <html> 에 붙인다 */
    --font: var(--font-noto-sans-kr), system-ui, sans-serif;
    --mono: ui-monospace, Menlo, Consolas, monospace;

    /* 모서리 */
    --radius: 8px;
    --radius-lg: 12px;
}

/* 크기 — 이용자(기본) */
:root,
[data-area="user"] {
    --font-size-base: 15px;
    --control-h: 48px;
    --control-h-lg: 52px;
    --control-h-sm: 36px;
    --control-font: 15px;
    --control-weight: 700;
    --control-px: 14px;
    --badge-h: 24px;
}

/* 크기 — 콘솔(업체 관리자 · 관리자). 영역 layout 이 data-area="console" 을 붙인다 */
[data-area="console"] {
    --font-size-base: 14px;
    --control-h: 40px;
    --control-h-lg: 48px;
    --control-h-sm: 32px;
    --control-font: 14px;
    --control-weight: 500;
    --control-px: 12px;
    --badge-h: 22px;
}

*,
*::before,
*::after {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
}

body {
    background: var(--bg);
    color: var(--fg);
    font-family: var(--font);
    font-size: var(--font-size-base);
    line-height: 1.5;
}

[data-area] {
    font-size: var(--font-size-base);
}

a {
    color: var(--primary);
}

a:hover {
    color: var(--primary-strong);
}

::placeholder {
    color: var(--faint);
}

:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}
```

```tsx
// src/app/layout.tsx — 바뀐 부분 (serverUrl · serverName · adsensePublisherId · viewport · metadata 는 그대로)
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import RootLayoutContent from './RootLayoutContent';
import './globals.css';

const notoSansKr = Noto_Sans_KR({
    subsets: ['latin'],
    weight: ['400', '500', '700'],
    display: 'swap',
    variable: '--font-noto-sans-kr',
});

// … serverUrl · serverName · adsensePublisherId · viewport · metadata 그대로 …

type RootLayoutProps = {
    children: React.ReactNode;
    modal: React.ReactNode; // src/app/@modal — 경로 모달 슬롯
};

export default function RootLayout({ children, modal }: RootLayoutProps) {
    return (
        // 문서 — 글꼴 변수를 <html> 에 붙인다
        <html lang="ko" className={notoSansKr.variable}>
            <body>
                {/* 로그인 상태 · Provider · 경로 모달 */}
                <RootLayoutContent modal={modal}>
                    {children}
                </RootLayoutContent>
            </body>
        </html>
    )
}
```

```tsx
// src/app/RootLayoutContent.tsx — 전체 (modal 그리기 · 진행 막대 색 · 구조 규칙)
'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deleteToken, getAccessToken } from '@/shared/api/cookie';
import NextTopLoader from 'nextjs-toploader';
import Scripts from '@/shared/components/Scripts';
import RootLayoutProvider from '@/shared/providers/RootLayoutProvider';

type RootLayoutContentProps = {
    children: React.ReactNode;
    modal?: React.ReactNode; // 경로 모달 — Provider 안에서 그려 Context 를 쓸 수 있게
};

export default function RootLayoutContent({ children, modal }: RootLayoutContentProps): React.ReactNode {
    // 변수
    const pathname = usePathname(); // 지금 주소 — 바뀔 때마다 로그인 상태를 다시 확인

    // 상태
    const [rootLayoutLoading, setRootLayoutLoading] = useState<boolean>(true); // 최상위 레이아웃 로딩여부
    const [accessToken, setAccessToken] = useState<string>(null);              // AccessToken

    // 효과
    useEffect(() => {
        // 이전페이지정보 저장.
        if (pathname.indexOf('/sign') === -1) {
            sessionStorage.setItem('referer', pathname);
        }

        getAccessToken().then(async (accessToken: string) => {
            if (accessToken) {
                setAccessToken(accessToken);
            } else {
                await deleteToken();
                setAccessToken(null);
            }

            // 레이아웃 로딩완료
            setRootLayoutLoading(false);
        });
    }, [pathname]);

    return (
        // 루트 — 진행 막대 · 화면
        <>
            {/* 상단 진행 막대 */}
            <NextTopLoader color="var(--primary)" showSpinner={false} />

            {/* 화면 */}
            <div id="wrap">
                {/* 외부 스크립트 */}
                <Scripts />

                {/* 로그인 상태 Context — 화면 · 경로 모달 */}
                <RootLayoutProvider
                    rootLayoutLoading={rootLayoutLoading}
                    accessTokenData={{accessToken, setAccessToken}}
                    isLogin={accessToken ? true : false}
                >
                    {children}
                    {modal}
                </RootLayoutProvider>
            </div>
        </>
    )
}
```

### 공통 UI 부품 (#2) — `src/shared/components/ui/`

규칙: default export · `type <Name>Props` · 반환 `React.ReactNode`(형제 `src/shared/components/KakaoMap.tsx:10,47`), 스타일은 옆 `<Name>.module.css` 에 토큰 `var(--…)` 만. 상태 · 효과가 있는 부품만 `'use client'`. 본문은 memory 구조 규칙대로.

```tsx
// src/shared/components/ui/Button.tsx
import type { ComponentProps } from 'react';
import styles from './Button.module.css';

type ButtonStyle = {
    variant?: 'default' | 'primary' | 'danger';
    size?: 'md' | 'sm' | 'lg';
    icon?: boolean; // 정사각 아이콘 버튼 — aria-label 을 붙인다
    full?: boolean; // 가로 꽉 채움
};

type ButtonProps = ComponentProps<'button'> & ButtonStyle;

/**
 * 버튼 클래스 — <Link> 처럼 다른 요소를 버튼 모양으로 그릴 때
 *
 * @param style 모양
 * @returns className
 */
export function buttonClass({variant = 'default', size = 'md', icon = false, full = false}: ButtonStyle = {}): string {
    return [
        styles.button,
        variant === 'default' ? '' : styles[variant],
        size === 'md' ? '' : styles[size],
        icon ? styles.icon : '',
        full ? styles.full : '',
    ].filter(Boolean).join(' ');
}

/**
 * 버튼 — 기본 · 강조(primary) · 위험(danger), 크기 sm · md · lg
 *
 * @param param0
 * @returns
 */
export default function Button({variant, size, icon, full, type = 'button', className, ...rest}: ButtonProps): React.ReactNode {
    // 변수
    const classNames = [buttonClass({variant, size, icon, full}), className ?? ''].filter(Boolean).join(' '); // 모양 클래스 + 밖에서 넘긴 클래스

    return (
        // 버튼
        <button type={type} className={classNames} {...rest} />
    );
}
```

```css
/* src/shared/components/ui/Button.module.css */
.button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: var(--control-h);
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-size: var(--control-font);
    font-weight: var(--control-weight);
    line-height: 1;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
}

.button:hover {
    background: var(--surface-2);
    color: var(--fg);
}

.primary {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--on-primary);
}

.primary:hover {
    background: var(--primary-strong);
    border-color: var(--primary-strong);
    color: var(--on-primary);
}

.danger {
    border-color: var(--danger);
    color: var(--danger);
}

.danger:hover {
    background: var(--danger-soft);
    color: var(--danger);
}

.button:disabled,
.button:disabled:hover {
    background: var(--line);
    border-color: var(--line);
    color: var(--muted);
    cursor: not-allowed;
}

.sm {
    height: var(--control-h-sm);
    padding: 0 10px;
    font-size: 13px;
}

.lg {
    height: var(--control-h-lg);
    font-size: 16px;
}

.icon {
    width: var(--control-h);
    padding: 0;
}

.sm.icon {
    width: var(--control-h-sm);
}

.lg.icon {
    width: var(--control-h-lg);
}

.full {
    width: 100%;
}
```

```tsx
// src/shared/components/ui/Input.tsx
import type { ComponentProps } from 'react';
import styles from './Input.module.css';

type InputProps = ComponentProps<'input'> & {
    invalid?: boolean; // 오류 테두리
};

/**
 * 한 줄 입력
 *
 * @param param0
 * @returns
 */
export default function Input({invalid = false, className, ...rest}: InputProps): React.ReactNode {
    // 변수
    const classNames = [styles.input, invalid ? styles.invalid : '', className ?? ''].filter(Boolean).join(' '); // 기본 · 오류 · 밖에서 넘긴 클래스

    return (
        // 한 줄 입력
        <input className={classNames} aria-invalid={invalid || undefined} {...rest} />
    );
}
```

```tsx
// src/shared/components/ui/Textarea.tsx
import type { ComponentProps } from 'react';
import styles from './Input.module.css';

type TextareaProps = ComponentProps<'textarea'> & {
    invalid?: boolean; // 오류 테두리
};

/**
 * 여러 줄 입력 — 한 줄 입력과 같은 모양
 *
 * @param param0
 * @returns
 */
export default function Textarea({invalid = false, className, ...rest}: TextareaProps): React.ReactNode {
    // 변수
    const classNames = [styles.input, styles.textarea, invalid ? styles.invalid : '', className ?? ''].filter(Boolean).join(' '); // 기본 · 여러 줄 · 오류 · 밖에서 넘긴 클래스

    return (
        // 여러 줄 입력
        <textarea className={classNames} aria-invalid={invalid || undefined} {...rest} />
    );
}
```

```css
/* src/shared/components/ui/Input.module.css */
.input {
    display: block;
    width: 100%;
    height: var(--control-h);
    padding: 0 var(--control-px);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-size: var(--control-font);
}

.input[readonly],
.input:disabled {
    background: var(--surface-2);
    color: var(--muted);
}

.invalid {
    border-color: var(--danger);
}

.textarea {
    height: auto;
    min-height: calc(var(--control-h) * 2);
    padding: 10px var(--control-px);
    line-height: 1.6;
    resize: vertical;
}
```

```tsx
// src/shared/components/ui/Field.tsx
import styles from './Field.module.css';

type FieldProps = {
    label: string;
    name: string;      // 오류 span 의 data-id — 백엔드 DTO 필드 이름
    htmlFor?: string;  // 라벨이 가리킬 입력 id (기본 name)
    dataKey?: string;  // 중첩 DTO 키 — validateActionChildren(dto, key) 의 key
    hint?: string;
    required?: boolean;
    children: React.ReactNode;
};

/**
 * 입력 칸 — 라벨 · 입력 · 오류 span(validation-alert) · 도움말
 * - 오류 span 은 src/shared/utils/validation.ts 의 showValidationErrors / resetValidationError 가 채우고 지운다
 *
 * @param param0
 * @returns
 */
export default function Field({label, name, htmlFor, dataKey, hint, required = false, children}: FieldProps): React.ReactNode {
    // 변수
    const inputId = htmlFor ?? name; // 라벨이 가리킬 입력 id

    return (
        // 칸
        <div className={styles.field}>
            {/* 라벨 — 필수면 * */}
            <label className={styles.label} htmlFor={inputId}>
                {label}
                {required ? <span className={styles.required} aria-hidden="true"> *</span> : null}
            </label>

            {/* 입력 */}
            {children}

            {/* 오류 span — validation.ts 가 채우고 지운다 */}
            <span className={styles.error} data-type="validation-alert" data-id={name} data-key={dataKey} />

            {/* 도움말 */}
            {hint ? <p className={styles.hint}>{hint}</p> : null}
        </div>
    );
}
```

```css
/* src/shared/components/ui/Field.module.css */
.field {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.label {
    display: block;
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--fg);
}

.required {
    color: var(--danger);
}

/* validation.ts 가 오류일 때 display:block 으로 연다 */
.error {
    display: none;
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--danger);
}

.hint {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--muted);
    line-height: 1.5;
}
```

```tsx
// src/shared/components/ui/Badge.tsx
import styles from './Badge.module.css';

type BadgeProps = {
    tone?: 'neutral' | 'ok' | 'primary' | 'inuse' | 'warn' | 'danger';
    children: React.ReactNode;
};

/**
 * 상태 배지
 *
 * @param param0
 * @returns
 */
export default function Badge({tone = 'neutral', children}: BadgeProps): React.ReactNode {
    // 변수
    const classNames = `${styles.badge} ${styles[tone]}`; // 배지 · 색

    return (
        // 배지
        <span className={classNames}>{children}</span>
    );
}
```

```css
/* src/shared/components/ui/Badge.module.css */
.badge {
    display: inline-flex;
    align-items: center;
    height: var(--badge-h);
    padding: 0 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
}

.neutral {
    background: var(--neutral-bg);
    color: var(--neutral-fg);
}

.ok {
    background: var(--ok-soft);
    color: var(--ok);
}

.primary {
    background: var(--primary-soft);
    color: var(--primary-strong);
}

.inuse {
    background: var(--primary-strong);
    color: var(--on-primary);
}

.warn {
    background: var(--warn-soft);
    color: var(--warn);
}

.danger {
    background: var(--danger-soft);
    color: var(--danger);
}
```

```tsx
// src/shared/components/ui/Band.tsx
import styles from './Band.module.css';

type BandProps = {
    tone?: 'info' | 'warn' | 'danger';
    title?: string;
    children?: React.ReactNode;
};

/**
 * 안내 띠 — 회원 상태(BLOCK · LEAVE_WAIT) · 업체 상태(SUSPEND) · 화면 안내
 *
 * @param param0
 * @returns
 */
export default function Band({tone = 'info', title, children}: BandProps): React.ReactNode {
    // 변수
    const classNames = `${styles.band} ${styles[tone]}`; // 띠 · 색

    return (
        // 안내 띠
        <div className={classNames}>
            <div className={styles.body}>
                {/* 제목 */}
                {title ? <strong className={styles.title}>{title}</strong> : null}

                {/* 내용 */}
                {children ? <div>{children}</div> : null}
            </div>
        </div>
    );
}
```

```css
/* src/shared/components/ui/Band.module.css */
.band {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    border-radius: var(--radius);
    font-size: 13px;
    line-height: 1.6;
}

.body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.title {
    font-size: 14px;
    font-weight: 700;
}

.info {
    background: var(--primary-soft);
    color: var(--primary-strong);
}

.warn {
    background: var(--warn-soft);
    color: var(--warn);
}

.danger {
    background: var(--danger-soft);
    color: var(--danger);
}
```

```tsx
// src/shared/components/ui/Switch.tsx
import styles from './Switch.module.css';

type SwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
};

/**
 * 켜기 · 끄기 스위치 (role="switch")
 *
 * @param param0
 * @returns
 */
export default function Switch({checked, onChange, label, disabled = false}: SwitchProps): React.ReactNode {
    // 함수
    function toggle(): void {
        onChange(!checked);
    }

    return (
        // 라벨로 감싼 스위치 — 글자를 눌러도 바뀐다
        <label className={styles.wrap}>
            {/* 스위치 */}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                className={styles.switch}
                onClick={toggle}
            />

            {/* 이름 */}
            <span>{label}</span>
        </label>
    );
}
```

```css
/* src/shared/components/ui/Switch.module.css */
.wrap {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: var(--control-font);
    cursor: pointer;
}

.switch {
    position: relative;
    display: inline-block;
    flex: none;
    width: 40px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--faint);
    cursor: pointer;
}

.switch::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--surface);
    transition: left 0.15s;
}

.switch[aria-checked="true"] {
    background: var(--primary);
}

.switch[aria-checked="true"]::after {
    left: 19px;
}

.switch:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
    .switch::after {
        transition: none;
    }
}
```

```tsx
// src/shared/components/ui/Chip.tsx
import type { ComponentProps } from 'react';
import styles from './Chip.module.css';

type ChipProps = ComponentProps<'button'> & {
    pressed: boolean; // 눌린 상태 (aria-pressed)
};

/**
 * 칩 — 누름 상태가 있는 작은 둥근 버튼 (시간대 · 반경 · 요일 고르기)
 *
 * @param param0
 * @returns
 */
export default function Chip({pressed, type = 'button', className, ...rest}: ChipProps): React.ReactNode {
    // 변수
    const classNames = [styles.chip, className ?? ''].filter(Boolean).join(' '); // 칩 · 밖에서 넘긴 클래스

    return (
        // 칩
        <button type={type} aria-pressed={pressed} className={classNames} {...rest} />
    );
}
```

```css
/* src/shared/components/ui/Chip.module.css */
.chip {
    min-width: 40px;
    height: var(--control-h-sm);
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-size: calc(var(--control-font) - 1px);
    font-weight: 500;
    cursor: pointer;
}

.chip[aria-pressed="true"] {
    background: var(--primary-soft);
    border-color: var(--primary);
    color: var(--primary-strong);
    font-weight: 700;
}

.chip:disabled {
    background: var(--line);
    color: var(--muted);
    cursor: not-allowed;
}
```

```tsx
// src/shared/components/ui/Segmented.tsx
import styles from './Segmented.module.css';

export type SegmentedOptionType<T extends string> = {
    value: T;
    label: string;
};

type SegmentedProps<T extends string> = {
    options: Array<SegmentedOptionType<T>>;
    value: T;
    onChange: (value: T) => void;
    label: string; // 묶음 이름 (aria-label)
};

/**
 * 선택 버튼 묶음 — 여러 개 중 하나 (role="radiogroup")
 *
 * @param param0
 * @returns
 */
export default function Segmented<T extends string>({options, value, onChange, label}: SegmentedProps<T>): React.ReactNode {
    // 함수
    function select(option: SegmentedOptionType<T>): void {
        if (option.value !== value) {
            onChange(option.value);
        }
    }

    return (
        // 선택 버튼 묶음
        <div role="radiogroup" aria-label={label} className={styles.segmented}>
            {/* 선택지 */}
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={option.value === value}
                    className={styles.option}
                    onClick={() => select(option)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
```

```css
/* src/shared/components/ui/Segmented.module.css */
.segmented {
    display: inline-flex;
    flex-wrap: wrap;
    padding: 3px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
}

.option {
    height: calc(var(--control-h) - 8px);
    padding: 0 14px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-size: calc(var(--control-font) - 1px);
    font-weight: 500;
    cursor: pointer;
}

.option[aria-checked="true"] {
    background: var(--primary-soft);
    color: var(--primary-strong);
    font-weight: 700;
}
```

```tsx
// src/shared/components/ui/Tabs.tsx
import Link from 'next/link';
import styles from './Tabs.module.css';

export type TabItemType<T extends string> = {
    value: T;
    label: string;
    href?: string; // 있으면 링크 탭(주소가 바뀜), 없으면 버튼 탭(onChange)
};

type TabsProps<T extends string> = {
    items: Array<TabItemType<T>>;
    value: T;
    onChange?: (value: T) => void;
    label: string; // 탭 묶음 이름 (aria-label)
};

/**
 * 탭 — 지금 탭은 aria-current
 *
 * @param param0
 * @returns
 */
export default function Tabs<T extends string>({items, value, onChange, label}: TabsProps<T>): React.ReactNode {
    // 함수
    function select(item: TabItemType<T>): void {
        if (item.value !== value) {
            onChange?.(item.value);
        }
    }

    return (
        // 탭 묶음
        <nav aria-label={label} className={styles.tabs}>
            {/* 탭 — href 가 있으면 링크 탭, 없으면 버튼 탭 */}
            {items.map((item) => item.href ? (
                <Link
                    key={item.value}
                    href={item.href}
                    className={styles.tab}
                    aria-current={item.value === value ? 'page' : undefined}
                >
                    {item.label}
                </Link>
            ) : (
                <button
                    key={item.value}
                    type="button"
                    className={styles.tab}
                    aria-current={item.value === value ? 'true' : undefined}
                    onClick={() => select(item)}
                >
                    {item.label}
                </button>
            ))}
        </nav>
    );
}
```

```css
/* src/shared/components/ui/Tabs.module.css */
.tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    border-bottom: 1px solid var(--line);
}

.tab {
    display: inline-flex;
    align-items: center;
    height: 44px;
    margin-bottom: -1px;
    padding: 0 16px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-size: var(--control-font);
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
}

.tab:hover {
    color: var(--fg);
}

.tab[aria-current] {
    border-bottom-color: var(--primary);
    color: var(--primary-strong);
    font-weight: 700;
}
```

```tsx
// src/shared/components/ui/Card.tsx
import styles from './Card.module.css';

type CardProps = {
    title?: string;
    actions?: React.ReactNode; // 제목 오른쪽 버튼들
    children: React.ReactNode;
};

/**
 * 카드 — 흰 바탕 묶음, 제목 · 오른쪽 버튼 줄(선택)
 *
 * @param param0
 * @returns
 */
export default function Card({title, actions, children}: CardProps): React.ReactNode {
    // 변수
    const hasHeader = Boolean(title || actions); // 머리 줄을 그릴지

    return (
        // 카드
        <section className={styles.card}>
            {/* 머리 — 제목 · 오른쪽 버튼 */}
            {hasHeader ? (
                <header className={styles.header}>
                    {title ? <h2 className={styles.title}>{title}</h2> : null}
                    {actions ? <div className={styles.actions}>{actions}</div> : null}
                </header>
            ) : null}

            {/* 내용 */}
            {children}
        </section>
    );
}
```

```css
/* src/shared/components/ui/Card.module.css */
.card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding: 20px 24px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
}

.header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
```

```tsx
// src/shared/components/ui/Table.tsx
import styles from './Table.module.css';

type TableProps = {
    caption?: string;
    children: React.ReactNode; // <thead> · <tbody>
};

/**
 * 표 틀 — 가로로 넘치면 스크롤
 *
 * @param param0
 * @returns
 */
export default function Table({caption, children}: TableProps): React.ReactNode {
    return (
        // 가로 스크롤 틀
        <div className={styles.wrap}>
            <table className={styles.table}>
                {/* 표 제목 */}
                {caption ? <caption className={styles.caption}>{caption}</caption> : null}

                {/* thead · tbody */}
                {children}
            </table>
        </div>
    );
}
```

```css
/* src/shared/components/ui/Table.module.css */
.wrap {
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow);
}

.table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.caption {
    padding: 12px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
    text-align: left;
}

.table th {
    padding: 10px 12px;
    border-bottom: 1px solid var(--line);
    background: var(--surface-2);
    color: var(--muted);
    font-size: 12px;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
}

.table td {
    padding: 12px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
    vertical-align: middle;
}

.table tbody tr:last-child td {
    border-bottom: 0;
}
```

```tsx
// src/shared/components/ui/EmptyState.tsx
import styles from './EmptyState.module.css';

type EmptyStateProps = {
    title: string;
    description?: string;
    action?: React.ReactNode;
};

/**
 * 빈 상태 — 목록이 비었을 때
 *
 * @param param0
 * @returns
 */
export default function EmptyState({title, description, action}: EmptyStateProps): React.ReactNode {
    return (
        // 빈 상태
        <div className={styles.empty}>
            {/* 제목 */}
            <p className={styles.title}>{title}</p>

            {/* 설명 */}
            {description ? <p className={styles.description}>{description}</p> : null}

            {/* 다음 행동 버튼 */}
            {action ? <div className={styles.action}>{action}</div> : null}
        </div>
    );
}
```

```css
/* src/shared/components/ui/EmptyState.module.css */
.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 40px 16px;
    text-align: center;
}

.title {
    margin: 0;
    color: var(--fg);
    font-size: 16px;
    font-weight: 700;
}

.description {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
}

.action {
    margin-top: 10px;
}
```

```tsx
// src/shared/components/ui/Modal.tsx
'use client';
import { useEffect, useId, useRef } from 'react';
import styles from './Modal.module.css';

type ModalProps = {
    open: boolean;
    title: string;
    onClose: () => void;      // Esc · 닫기 버튼 — 부모가 open 을 false 로 바꾼다
    footer?: React.ReactNode; // 아래 버튼 줄
    children: React.ReactNode;
};

/**
 * 모달 — 브라우저 <dialog>(showModal). Esc · 바깥 막기 · 포커스는 브라우저 기본
 * - 열려 있을 때만 내용을 그려, 다시 열면 안의 입력이 처음 상태로 돌아간다
 *
 * @param param0
 * @returns
 */
export default function Modal({open, title, onClose, footer, children}: ModalProps): React.ReactNode {
    // 변수
    const dialogRef = useRef<HTMLDialogElement>(null); // <dialog> 요소
    const titleId = useId();                           // 제목 id — aria-labelledby

    // 효과
    useEffect(() => {
        // open 에 맞춰 <dialog> 를 열고 닫는다
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }

        if (open && !dialog.open) {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else {
                dialog.setAttribute('open', ''); // showModal 이 없는 환경(jsdom 등)
            }
        } else if (!open && dialog.open) {
            if (typeof dialog.close === 'function') {
                dialog.close();
            } else {
                dialog.removeAttribute('open');
            }
        }
    }, [open]);

    // 함수
    function cancel(event: React.SyntheticEvent<HTMLDialogElement>): void {
        event.preventDefault(); // Esc — 닫힘은 부모가 open 으로 정한다
        onClose();
    }

    return (
        // 모달 — 열려 있을 때만 내용을 그린다
        <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onCancel={cancel}>
            {open ? (
                <>
                    {/* 머리 — 제목 · 닫기 */}
                    <header className={styles.header}>
                        <h2 id={titleId} className={styles.title}>{title}</h2>
                        <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>×</button>
                    </header>

                    {/* 본문 */}
                    <div className={styles.body}>{children}</div>

                    {/* 아래 버튼 줄 */}
                    {footer ? <footer className={styles.footer}>{footer}</footer> : null}
                </>
            ) : null}
        </dialog>
    );
}
```

```css
/* src/shared/components/ui/Modal.module.css */
.dialog {
    width: calc(100% - 32px);
    max-width: 520px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-lg);
    background: var(--surface);
    color: var(--fg);
    box-shadow: var(--shadow);
}

.dialog::backdrop {
    background: var(--scrim);
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 24px 0;
}

.title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: var(--muted);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
}

.close:hover {
    background: var(--surface-2);
    color: var(--fg);
}

.body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 24px 0;
}

.body:last-child {
    padding-bottom: 24px;
}

.footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    padding: 20px 24px 24px;
}
```

```tsx
// src/shared/components/ui/ConfirmModal.tsx
'use client';
import Button from './Button';
import Modal from './Modal';

type ConfirmModalProps = {
    open: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean; // 확인 버튼을 위험 모양으로
    busy?: boolean;   // 처리 중 — 확인을 막는다(큐 API 응답 대기)
    onConfirm: () => void;
    onClose: () => void;
};

/**
 * 확인 모달 — 취소 · 확인
 *
 * @param param0
 * @returns
 */
export default function ConfirmModal({open, title, message, confirmLabel = '확인', cancelLabel = '취소', danger = false, busy = false, onConfirm, onClose}: ConfirmModalProps): React.ReactNode {
    return (
        // 확인 모달
        <Modal
            open={open}
            title={title}
            onClose={onClose}
            footer={
                <>
                    {/* 취소 */}
                    <Button onClick={onClose}>{cancelLabel}</Button>

                    {/* 확인 — 처리 중이면 막는다 */}
                    <Button variant={danger ? 'danger' : 'primary'} disabled={busy} onClick={onConfirm}>{confirmLabel}</Button>
                </>
            }
        >
            {/* 묻는 말 */}
            <div>{message}</div>
        </Modal>
    );
}
```

```tsx
// src/shared/components/ui/ReasonModal.tsx
'use client';
import { useId, useState } from 'react';
import Button from './Button';
import Field from './Field';
import Modal from './Modal';
import Textarea from './Textarea';
import styles from './ReasonModal.module.css';

type ReasonModalProps = {
    open: boolean;
    title: string;
    description?: React.ReactNode;
    label?: string;        // 칸 이름 (기본 '사유')
    name?: string;         // 오류 span data-id — 백엔드 DTO 필드 이름 (예: cancel_reason)
    placeholder?: string;
    maxLength?: number;    // 기본 200 — 넘는 입력은 잘라서 받는다
    required?: boolean;    // 기본 true — 비어 있거나 공백뿐이면 확인을 막는다
    confirmLabel?: string;
    danger?: boolean;      // 확인 버튼을 위험 모양으로
    busy?: boolean;        // 처리 중 — 확인을 막는다(큐 API 응답 대기)
    onConfirm: (reason: string) => void; // 앞뒤 공백을 뺀 사유
    onClose: () => void;
};

type ReasonModalBodyProps = Omit<ReasonModalProps, 'open' | 'title'>;

/**
 * 사유 입력 모달 — 업체 취소 · 반려 · 정지 · 탈퇴 사유
 *
 * @param param0
 * @returns
 */
export default function ReasonModal({open, title, onClose, ...bodyProps}: ReasonModalProps): React.ReactNode {
    return (
        // 모달 — 열릴 때마다 본문을 새로 그려 입력이 비워진다
        <Modal open={open} title={title} onClose={onClose}>
            {/* 사유 칸 · 버튼 줄 */}
            <ReasonModalBody onClose={onClose} {...bodyProps} />
        </Modal>
    );
}

/**
 * 사유 입력 모달 본문 — Modal 이 열려 있을 때만 그려진다
 *
 * @param param0
 * @returns
 */
function ReasonModalBody({description, label = '사유', name = 'reason', placeholder, maxLength = 200, required = true, confirmLabel = '확인', danger = false, busy = false, onConfirm, onClose}: ReasonModalBodyProps): React.ReactNode {
    // 변수
    const inputId = useId(); // 사유 칸 id — 라벨과 연결

    // 상태
    const [reason, setReason] = useState<string>(''); // 입력한 사유

    // 계산 값
    const trimmed = reason.trim();                         // 앞뒤 공백을 뺀 사유
    const blocked = (required && trimmed === '') || busy;  // 확인을 막을지

    // 함수
    function change(event: React.ChangeEvent<HTMLTextAreaElement>): void {
        setReason(event.target.value.slice(0, maxLength)); // maxLength 를 넘는 입력은 자른다
    }

    function confirm(): void {
        if (!blocked) {
            onConfirm(trimmed);
        }
    }

    return (
        // 본문
        <>
            {/* 설명 */}
            {description ? <div className={styles.description}>{description}</div> : null}

            {/* 사유 칸 — 글자 수 */}
            <Field label={label} name={name} htmlFor={inputId} required={required} hint={`${reason.length} / ${maxLength}`}>
                <Textarea id={inputId} value={reason} placeholder={placeholder} rows={4} onChange={change} />
            </Field>

            {/* 버튼 줄 — 취소 · 확인 */}
            <div className={styles.actions}>
                <Button onClick={onClose}>취소</Button>
                <Button variant={danger ? 'danger' : 'primary'} disabled={blocked} onClick={confirm}>
                    {confirmLabel}
                </Button>
            </div>
        </>
    );
}
```

```css
/* src/shared/components/ui/ReasonModal.module.css */
.description {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
}

.actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
}
```

```tsx
// src/shared/components/ui/RouteModal.tsx
'use client';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

type RouteModalProps = {
    title: string;
    footer?: React.ReactNode;
    children: React.ReactNode;
};

/**
 * 경로 모달 — src/app/@modal/(.)<주소>/page.tsx 에서 감싼다
 * - 닫으면 router.back() 으로 아래 화면 주소로 돌아간다
 * - 같은 주소의 보통 페이지(src/app/<주소>/page.tsx)가 새로고침 · 직접 접속을 맡는다
 *
 * @param param0
 * @returns
 */
export default function RouteModal({title, footer, children}: RouteModalProps): React.ReactNode {
    // 변수
    const router = useRouter(); // 닫을 때 뒤로 가기

    // 함수
    function close(): void {
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
```

```tsx
// src/shared/components/ui/CopyButton.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import Button from './Button';

type CopyButtonProps = {
    text: string;          // 복사할 글자 (예: 업체 로그인 주소)
    label?: string;        // 기본 '복사'
    size?: 'md' | 'sm' | 'lg';
};

const COPIED_MS: number = 2000;

/**
 * 복사 버튼 — 누르면 클립보드에 넣고 잠깐 "복사됨"
 *
 * @param param0
 * @returns
 */
export default function CopyButton({text, label = '복사', size = 'sm'}: CopyButtonProps): React.ReactNode {
    // 변수
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // "복사됨" 을 되돌리는 타이머

    // 상태
    const [copied, setCopied] = useState<boolean>(false); // 방금 복사했는지

    // 효과
    useEffect(() => {
        // 사라질 때 타이머 정리
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    // 함수
    async function copy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => setCopied(false), COPIED_MS);
        } catch {
            // http 같은 비보안 주소에서는 navigator.clipboard 가 없다
            alert('복사하지 못했습니다. 직접 선택해 복사해 주세요.');
        }
    }

    return (
        // 복사 버튼 — 복사하면 잠깐 "복사됨"
        <Button size={size} onClick={copy} aria-live="polite">
            {copied ? '복사됨' : label}
        </Button>
    );
}
```

### 경로 모달 규칙 — `src/app/@modal`

슬롯은 루트 한 곳(Next.js 문서 parallel-routes "Modals" 예제와 같은 구성). 가로채는 팝업은 `src/app/@modal/(.)<주소>/page.tsx` 에서 `<RouteModal>` 로 감싸고, 같은 주소의 보통 페이지가 새로고침 · 직접 접속을 맡는다.

```tsx
// src/app/@modal/default.tsx — 가로채는 주소가 아니면 슬롯은 비어 있다
export default function ModalDefault(): React.ReactNode {
    return null;
}
```

```tsx
// src/app/@modal/[...catchAll]/page.tsx — 팝업을 연 채 다른 주소로 가면 슬롯을 비운다 (Next.js 문서 권장)
export default function ModalCatchAll(): React.ReactNode {
    return null;
}
```

```tsx
// src/app/@modal/(.)dev/ui/modal-demo/page.tsx — 경로 모달 예시(가로채기, 개발 전용)
import RouteModal from '@/shared/components/ui/RouteModal';
import ModalDemoContent from '@/app/dev/ui/modal-demo/ModalDemoContent';

export default function ModalDemoIntercept(): React.ReactNode {
    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    return (
        // 팝업 — 닫으면 /dev/ui 로
        <RouteModal title="경로 모달 예시">
            {/* 예시 내용 */}
            <ModalDemoContent />
        </RouteModal>
    );
}
```

### 미리보기 — `/dev/ui` (개발 전용, 운영 404)

```tsx
// src/app/dev/ui/page.tsx
import { notFound } from 'next/navigation';
import UiPreviewContent from './UiPreviewContent';

// 개발 전용 — 공통 UI 부품 미리보기 (운영 404)
export default function UiPreview(): React.ReactNode {
    if (process.env.NODE_ENV === 'production') {
        notFound();
    }

    return (
        // 미리보기 화면
        <UiPreviewContent />
    );
}
```

```tsx
// src/app/dev/ui/modal-demo/page.tsx — 경로 모달 예시의 보통 페이지(새로고침 · 직접 접속)
import { notFound } from 'next/navigation';
import ModalDemoContent from './ModalDemoContent';

export default function ModalDemo(): React.ReactNode {
    if (process.env.NODE_ENV === 'production') {
        notFound();
    }

    return (
        // 예시 내용을 보통 페이지로
        <ModalDemoContent />
    );
}
```

```tsx
// src/app/dev/ui/modal-demo/ModalDemoContent.tsx
export default function ModalDemoContent(): React.ReactNode {
    return (
        // 예시 내용
        <div>
            {/* 주소 */}
            <p>이 내용의 주소는 <code>/dev/ui/modal-demo/</code> 입니다.</p>

            {/* 보이는 방식 */}
            <p>미리보기에서 링크로 열면 팝업으로, 이 주소를 새로고침하거나 직접 열면 보통 페이지로 보입니다.</p>
        </div>
    );
}
```

```tsx
// src/app/dev/ui/UiPreviewContent.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/shared/components/ui/Badge';
import Band from '@/shared/components/ui/Band';
import Button, { buttonClass } from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Chip from '@/shared/components/ui/Chip';
import ConfirmModal from '@/shared/components/ui/ConfirmModal';
import CopyButton from '@/shared/components/ui/CopyButton';
import EmptyState from '@/shared/components/ui/EmptyState';
import Field from '@/shared/components/ui/Field';
import Input from '@/shared/components/ui/Input';
import ReasonModal from '@/shared/components/ui/ReasonModal';
import Segmented, { SegmentedOptionType } from '@/shared/components/ui/Segmented';
import Switch from '@/shared/components/ui/Switch';
import Table from '@/shared/components/ui/Table';
import Tabs, { TabItemType } from '@/shared/components/ui/Tabs';
import Textarea from '@/shared/components/ui/Textarea';
import { resetValidationError, showValidationErrors } from '@/shared/utils/validation';
import styles from './UiPreviewContent.module.css';

type AreaType = 'user' | 'console';
type RadiusType = '5' | '10' | '20';
type StoreTabType = 'info' | 'photo' | 'hours';

type GalleryProps = {
    area: AreaType; // data-area — 크기 토큰이 바뀐다
    title: string;
};

type SectionProps = {
    title: string;
    children: React.ReactNode;
};

const COLOR_TOKENS: Array<string> = [
    '--bg', '--surface', '--surface-2', '--line', '--fg', '--muted', '--faint',
    '--primary', '--primary-strong', '--primary-soft', '--ok', '--ok-soft', '--warn', '--warn-soft',
    '--danger', '--danger-soft', '--neutral-fg', '--neutral-bg', '--kakao', '--naver',
];

const RADIUS_OPTIONS: Array<SegmentedOptionType<RadiusType>> = [
    {value: '5', label: '5km'},
    {value: '10', label: '10km'},
    {value: '20', label: '20km'},
];

const STORE_TABS: Array<TabItemType<StoreTabType>> = [
    {value: 'info', label: '기본 정보'},
    {value: 'photo', label: '사진'},
    {value: 'hours', label: '영업시간'},
];

/**
 * 공통 UI 미리보기 — 왼쪽 이용자 크기, 오른쪽 콘솔 크기
 *
 * @returns
 */
export default function UiPreviewContent(): React.ReactNode {
    return (
        // 미리보기 화면
        <main className={styles.page}>
            {/* 머리 */}
            <header className={styles.head}>
                <h1 className={styles.headTitle}>공통 UI 미리보기</h1>
                <p className={styles.headDesc}>개발 전용 — 왼쪽은 이용자 크기, 오른쪽은 콘솔 크기(data-area=&quot;console&quot;). 운영에서는 404.</p>
            </header>

            {/* 색 토큰 */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>색 토큰</h2>
                <div className={styles.swatches}>
                    {COLOR_TOKENS.map((token) => (
                        <div key={token} className={styles.swatch}>
                            <span className={styles.swatchChip} style={{background: `var(${token})`}} />
                            <code>{token}</code>
                        </div>
                    ))}
                </div>
            </section>

            {/* 두 크기 나란히 */}
            <div className={styles.columns}>
                <Gallery area="user" title="이용자 크기" />
                <Gallery area="console" title="콘솔 크기" />
            </div>
        </main>
    );
}

/**
 * 한 영역 크기의 부품 모음
 *
 * @param param0
 * @returns
 */
function Gallery({area, title}: GalleryProps): React.ReactNode {
    // 변수
    const loginIdField = `${area}_login_id`; // 오류 표시 예시 칸 이름 — 두 열이 겹치지 않게 area 를 붙인다

    // 상태
    const [switchOn, setSwitchOn] = useState<boolean>(true);         // 스위치 예시
    const [chipOn, setChipOn] = useState<boolean>(true);             // 칩 예시
    const [radius, setRadius] = useState<RadiusType>('10');          // 선택 버튼 묶음 예시
    const [tab, setTab] = useState<StoreTabType>('info');            // 탭 예시
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);  // 확인 모달 열림
    const [reasonOpen, setReasonOpen] = useState<boolean>(false);    // 사유 입력 모달 열림
    const [lastReason, setLastReason] = useState<string>('');        // 사유 입력 모달에서 받은 사유

    // 함수
    function showError(): void {
        resetValidationError();
        showValidationErrors([{property: loginIdField, message: '아이디를 입력해주세요.'}]);
    }

    function toggleChip(): void {
        setChipOn(!chipOn);
    }

    function openConfirm(): void {
        setConfirmOpen(true);
    }

    function closeConfirm(): void {
        setConfirmOpen(false);
    }

    function openReason(): void {
        setReasonOpen(true);
    }

    function closeReason(): void {
        setReasonOpen(false);
    }

    function confirmReason(reason: string): void {
        setLastReason(reason);
        setReasonOpen(false);
    }

    return (
        // 한 영역 크기의 부품 모음 — data-area 로 크기가 바뀐다
        <div data-area={area} className={styles.column}>
            {/* 제목 */}
            <h2 className={styles.columnTitle}>{title}</h2>

            {/* 버튼 */}
            <Section title="버튼">
                <div className={styles.row}>
                    <Button variant="primary">예약하기</Button>
                    <Button>취소</Button>
                    <Button variant="danger">삭제</Button>
                    <Button disabled>비활성</Button>
                </div>
                <div className={styles.row}>
                    <Button size="sm">작은 버튼</Button>
                    <Button size="lg" variant="primary">큰 버튼</Button>
                    <Button icon aria-label="더보기">⋯</Button>
                </div>
                <Button variant="primary" full>꽉 찬 버튼</Button>
            </Section>

            {/* 입력 · 칸 — 오류 span 표시 확인 */}
            <Section title="입력 · 칸">
                <Field label="아이디" name={loginIdField} htmlFor={`${loginIdField}_input`} required hint="영문 · 숫자 4~20자">
                    <Input id={`${loginIdField}_input`} placeholder="아이디" />
                </Field>
                <Field label="읽기 전용" name={`${area}_store_code`} htmlFor={`${area}_store_code_input`}>
                    <Input id={`${area}_store_code_input`} value="a1b2c3d4e5f6" readOnly />
                </Field>
                <Field label="소개" name={`${area}_introduction`} htmlFor={`${area}_introduction_input`}>
                    <Textarea id={`${area}_introduction_input`} placeholder="업체 소개" />
                </Field>
                <div className={styles.row}>
                    <Button size="sm" onClick={showError}>오류 표시</Button>
                    <Button size="sm" onClick={resetValidationError}>오류 지우기</Button>
                </div>
            </Section>

            {/* 배지 */}
            <Section title="배지">
                <div className={styles.row}>
                    <Badge>이용 완료</Badge>
                    <Badge tone="ok">영업중</Badge>
                    <Badge tone="primary">예약 확정</Badge>
                    <Badge tone="inuse">이용 중</Badge>
                    <Badge tone="warn">결제 대기</Badge>
                    <Badge tone="danger">취소됨</Badge>
                </div>
            </Section>

            {/* 안내 띠 */}
            <Section title="안내 띠">
                <Band tone="info">시작 시각부터 QR 이 열립니다.</Band>
                <Band tone="warn" title="탈퇴 대기 중">14일 뒤 탈퇴됩니다. 그 전까지 철회할 수 있습니다.</Band>
                <Band tone="danger" title="이용이 제한된 계정입니다">새 예약 · 연장이 막혀 있습니다.</Band>
            </Section>

            {/* 스위치 · 칩 · 선택 버튼 묶음 */}
            <Section title="스위치 · 칩 · 선택 버튼 묶음">
                <Switch checked={switchOn} onChange={setSwitchOn} label="영업중" />
                <div className={styles.row}>
                    <Chip pressed={chipOn} onClick={toggleChip}>24시간</Chip>
                    <Chip pressed={false} disabled>마감</Chip>
                </div>
                <Segmented label="반경" options={RADIUS_OPTIONS} value={radius} onChange={setRadius} />
            </Section>

            {/* 탭 */}
            <Section title="탭">
                <Tabs label="내 업체 설정" items={STORE_TABS} value={tab} onChange={setTab} />
            </Section>

            {/* 카드 · 표 · 빈 상태 · 복사 */}
            <Section title="카드 · 표 · 빈 상태 · 복사">
                <Card title="호실" actions={<CopyButton text="http://localhost:5000/manager/a1b2c3d4e5f6/login/" label="로그인 주소 복사" />}>
                    <Table>
                        <thead>
                            <tr>
                                <th>호실</th>
                                <th>층</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>101호</td>
                                <td>1</td>
                                <td><Badge tone="ok">예약 가능</Badge></td>
                            </tr>
                            <tr>
                                <td>102호</td>
                                <td>1</td>
                                <td><Badge tone="warn">정비중</Badge></td>
                            </tr>
                        </tbody>
                    </Table>
                </Card>
                <EmptyState title="예약이 없습니다" description="주변 업체를 둘러보세요." action={<Button variant="primary" size="sm">둘러보기</Button>} />
            </Section>

            {/* 모달 — 확인 · 사유 입력 · 경로 모달 */}
            <Section title="모달">
                <div className={styles.row}>
                    <Button onClick={openConfirm}>확인 모달</Button>
                    <Button onClick={openReason}>사유 입력 모달</Button>
                    <Link href="/dev/ui/modal-demo/" className={buttonClass()}>경로 모달 열기</Link>
                </div>
                {lastReason ? <p className={styles.note}>마지막으로 받은 사유: {lastReason}</p> : null}
            </Section>

            {/* 확인 모달 */}
            <ConfirmModal
                open={confirmOpen}
                title="호실 삭제"
                message="101호를 삭제할까요? 되돌릴 수 없습니다."
                confirmLabel="삭제"
                danger
                onConfirm={closeConfirm}
                onClose={closeConfirm}
            />

            {/* 사유 입력 모달 */}
            <ReasonModal
                open={reasonOpen}
                title="업체 취소"
                description="시작 전 예약만 취소되고 전액 환불됩니다."
                name={`${area}_cancel_reason`}
                danger
                confirmLabel="업체 취소"
                onConfirm={confirmReason}
                onClose={closeReason}
            />
        </div>
    );
}

/**
 * 미리보기 한 묶음 — 작은 제목 + 부품
 *
 * @param param0
 * @returns
 */
function Section({title, children}: SectionProps): React.ReactNode {
    return (
        // 묶음
        <section className={styles.section}>
            {/* 작은 제목 */}
            <h3 className={styles.sectionTitle}>{title}</h3>

            {/* 부품 */}
            {children}
        </section>
    );
}
```

```css
/* src/app/dev/ui/UiPreviewContent.module.css */
.page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1440px;
    margin: 0 auto;
    padding: 32px 16px 96px;
}

.head {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.headTitle {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
}

.headDesc {
    margin: 0;
    color: var(--muted);
}

.columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr));
    gap: 24px;
    align-items: start;
}

.column {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
    padding: 20px;
    border: 1px dashed var(--faint);
    border-radius: var(--radius-lg);
}

.columnTitle {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
}

.section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}

.sectionTitle {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    font-weight: 700;
}

.row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
}

.swatch {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.swatchChip {
    flex: none;
    width: 28px;
    height: 28px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
}

.note {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
}
```

### 기존 코드 맞추기

```tsx
// src/shared/components/Loading.tsx — 초록 인라인 스타일(#15B06F) → 토큰 · CSS Module · 구조 규칙
import { ClipLoader } from 'react-spinners';
import styles from './Loading.module.css';

type LoadingProps = {
    size?: number;
    height?: number;
}

/**
 * 로딩 표시 — NEXT_PUBLIC_LOADING 이 '1' 일 때만 보인다
 *
 * @param param0
 * @returns
 */
export default function Loading({size = 150, height = 100}: LoadingProps): React.ReactNode {
    // 변수
    const visible = process.env.NEXT_PUBLIC_LOADING === '1'; // 로딩 표시를 켰는지

    if (!visible) {
        return null;
    }

    return (
        // 로딩 — 가운데 스피너
        <div className={styles.loading} style={{height: `${height}vh`}}>
            {/* 스피너 */}
            <ClipLoader size={size} color="var(--primary)" loading />
        </div>
    );
}
```

```css
/* src/shared/components/Loading.module.css */
.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
}
```

```ts
// src/shared/utils/validation.ts — showValidationErrors 안 한 줄 (src/shared/utils/validation.ts:38)
            alertElement.style.color = 'var(--danger)';
```

---

## Test Cases
```
[FAIL:validation] ReasonModal(필수) — 사유가 비어 있거나 공백뿐이면 확인 버튼이 비활성이고, 눌러도 `onConfirm` 이 불리지 않는다
[SUCCESS] ReasonModal — `"  고객 요청  "` 입력 후 확인 → `onConfirm("고객 요청")` 1회
[FAIL:validation] ReasonModal(`maxLength=5`) — `"123456789"` 입력 → 칸에는 `"12345"`, 확인 → `onConfirm("12345")` 1회
[SUCCESS] ReasonModal(필수 아님) — 비운 채 확인 → `onConfirm("")` 1회

테스트 생략(위임형): 토큰 · Button · Input · Textarea · Field · Badge · Band · Switch · Chip · Segmented · Tabs · Card · Table · Modal · ConfirmModal · RouteModal · EmptyState · CopyButton · `/dev/ui` — 그리기와 이벤트 전달만, 실제 모습은 `/dev/ui` 로 본다
```

```tsx
// src/shared/components/ui/ReasonModal.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ReasonModal from './ReasonModal';

type ReasonModalProps = React.ComponentProps<typeof ReasonModal>;

function renderReasonModal(props: Partial<ReasonModalProps> = {}) {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ReasonModal open title="업체 취소" onConfirm={onConfirm} onClose={onClose} {...props} />);

    const textarea = screen.getByRole('textbox', {name: /사유/}) as HTMLTextAreaElement;
    const confirm = screen.getByRole('button', {name: '확인'}) as HTMLButtonElement;
    return {onConfirm, onClose, textarea, confirm};
}

describe('ReasonModal', () => {
    it('[FAIL:validation] 필수인데 사유가 비어 있거나 공백뿐이면 확인을 막는다', () => {
        const {onConfirm, textarea, confirm} = renderReasonModal();

        expect(confirm.disabled).toBe(true);
        fireEvent.click(confirm);

        fireEvent.change(textarea, {target: {value: '   '}});
        expect(confirm.disabled).toBe(true);
        fireEvent.click(confirm);

        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('[SUCCESS] 확인하면 앞뒤 공백을 뺀 사유를 한 번 넘긴다', () => {
        const {onConfirm, textarea, confirm} = renderReasonModal();

        fireEvent.change(textarea, {target: {value: '  고객 요청  '}});
        fireEvent.click(confirm);

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith('고객 요청');
    });

    it('[FAIL:validation] maxLength 를 넘는 입력은 잘라서 받는다', () => {
        const {onConfirm, textarea, confirm} = renderReasonModal({maxLength: 5});

        fireEvent.change(textarea, {target: {value: '123456789'}});

        expect(textarea.value).toBe('12345');
        fireEvent.click(confirm);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith('12345');
    });

    it('[SUCCESS] 필수가 아니면 빈 사유로도 확인된다', () => {
        const {onConfirm, confirm} = renderReasonModal({required: false});

        expect(confirm.disabled).toBe(false);
        fireEvent.click(confirm);

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith('');
    });
});
```

---

## Response Codes
| Code | Cause |
|------|------|
| `/dev/ui` 200 | 개발(`NODE_ENV` 가 production 아님) — 미리보기 |
| `/dev/ui` 404 | 운영(`NODE_ENV=production`) — `notFound()` |
| `/dev/ui/modal-demo` 팝업 | 미리보기에서 링크로 이동(클라이언트 이동) — `@modal/(.)dev/ui/modal-demo` 가 가로챔 |
| `/dev/ui/modal-demo` 보통 페이지 | 새로고침 · 직접 접속 — `src/app/dev/ui/modal-demo/page.tsx` |
| 경로 모달 닫힘 | 닫기 · Esc → `router.back()` · 다른 주소로 이동 → `@modal/[...catchAll]` 이 null |
| `ReasonModal` 확인 | `onConfirm(앞뒤 공백을 뺀 사유)` 1회 · 필수인데 비면 확인 버튼 비활성 |
| `CopyButton` 실패 | 클립보드 없음(비보안 주소) → `alert` 안내 |
