'use client';
import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/shared/components/ui/display/Badge';
import Band from '@/shared/components/ui/display/Band';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Card from '@/shared/components/ui/display/Card';
import Chip from '@/shared/components/ui/form/Chip';
import ConfirmModal from '@/shared/components/ui/modal/ConfirmModal';
import CopyButton from '@/shared/components/ui/button/CopyButton';
import EmptyState from '@/shared/components/ui/display/EmptyState';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import ReasonModal from '@/shared/components/ui/modal/ReasonModal';
import Segmented, { SegmentedOptionType } from '@/shared/components/ui/form/Segmented';
import Switch from '@/shared/components/ui/form/Switch';
import Table from '@/shared/components/ui/display/Table';
import Pagination from '@/shared/components/ui/nav/Pagination';
import Tabs, { TabItemType } from '@/shared/components/ui/nav/Tabs';
import Textarea from '@/shared/components/ui/form/Textarea';
import { PaginationType } from '@/shared/types/pagination';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { resetValidationError, showValidationErrors } from '@/shared/utils/validation';
import styles from '@/app/css/dev/UiPreviewContent.module.css';

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
    const [page, setPage] = useState<string>('2');                   // 페이지 탭 예시 — 현재 페이지

    // 계산 값
    const pagination = previewPagination(Number(page)); // 페이지 탭 예시 값

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

    function openErrorPopup(): void {
        showErrorPopup('업체명을 입력해 주세요.', area === 'console' ? 'TypeError: 개발 때만 보이는 오류 원문 예시' : undefined);
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

            {/* 페이지 탭 */}
            <Section title="페이지 탭">
                <Pagination pagination={pagination} movePage={setPage} label={`${title} 페이지 예시`} />
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
                    <Button onClick={openErrorPopup}>오류 팝업</Button>
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
 * 미리보기용 페이지 정보 — 5쪽짜리 목록(100건, 20건씩)
 *
 * @param page 현재 페이지
 */
function previewPagination(page: number): PaginationType {
    return {
        all_search_yn: 'N',
        total_count: 100,
        page,
        max_page: 5,
        page_range: {start: 1, end: 5},
        content_start_number: 100 - (page - 1) * 20,
        content_start_number_reverse: (page - 1) * 20 + 1,
    };
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
