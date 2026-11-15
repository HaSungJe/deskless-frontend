'use client';
import { useEffect, useState } from 'react';
import { handleApiError } from '@/shared/api/error';
import { IMAGE_TYPE_MESSAGE } from '@/shared/api/upload';
import StoreMap from '@/shared/components/map/StoreMap';
import TossPaymentWidget, { TossPaymentType } from '@/shared/components/payment/TossPaymentWidget';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import Button from '@/shared/components/ui/button/Button';
import ImageUploader, { UploaderImageType } from '@/shared/components/upload/ImageUploader';
import useMyLocation from '@/shared/hooks/useMyLocation';
import { MapMarkerType, MapPointType } from '@/shared/types/map';
import { AddressWithCoordsType, preloadAddressSearch, searchAddressWithCoords } from '@/shared/utils/address';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { imageContentType } from '@/shared/utils/file';
import styles from '@/app/css/dev/InfraPreviewContent.module.css';

/** 미리보기 인증번호 — 이 값이면 인증 완료 */
const DEMO_CODE = '123456';

/** 미리보기 인증번호 · 결제 마감 */
const DEMO_EXPIRES_MS = 5 * 60 * 1000;

/**
 * 공통 인프라 미리보기 — 실제 API 없이 부품 동작만
 *
 * @returns
 */
export default function InfraPreviewContent(): React.ReactNode {
    // 변수
    const myLocation = useMyLocation(); // 내 위치 — 지도 처음 중심

    // 상태
    const [idleCenter, setIdleCenter] = useState<MapPointType | null>(null);   // 지도가 멈춘 중심
    const [clickedStore, setClickedStore] = useState<string>('');               // 누른 마커
    const [address, setAddress] = useState<AddressWithCoordsType | null>(null); // 주소 검색 결과
    const [smsResult, setSmsResult] = useState<string>('');                     // 인증 결과 문구
    const [images, setImages] = useState<Array<UploaderImageType>>([]);         // 올린 사진(브라우저 안에서만)
    const [payment, setPayment] = useState<TossPaymentType | null>(null);       // 미리보기 결제 정보

    // 계산 값
    const center = myLocation.location;                  // 지도 중심
    const markers = center ? sampleMarkers(center) : []; // 내 위치 둘레 예시 업체
    const locationLabel = myLocation.loading ? '위치 확인 중…' : myLocation.isDefault ? '기본 위치(서울시청)' : '내 위치'; // 위치 상태
    const idleLabel = idleCenter ? `${idleCenter.latitude.toFixed(5)}, ${idleCenter.longitude.toFixed(5)}` : '-';               // 멈춘 중심 글자

    // 효과
    useEffect(() => {
        // 주소 검색 스크립트를 미리 불러 둔다 — 첫 클릭에 팝업이 막히지 않게
        preloadAddressSearch();
    }, []);

    // 함수
    async function pickAddress(): Promise<void> {
        // 주소 검색 → 좌표
        try {
            setAddress(await searchAddressWithCoords());
        } catch (error) {
            handleApiError(error);
        }
    }

    async function demoSend(phone: string): Promise<SmsSentType | null> {
        // 미리보기 발송 — 번호 모양만 보고 5분짜리 인증을 돌려준다
        if (!/^01[016789]\d{7,8}$/.test(phone)) {
            showErrorPopup('휴대폰 번호를 숫자만 정확히 입력해주세요.');
            return null;
        }

        setSmsResult('');
        return {sms_verification_id: 'preview', expires_at: new Date(Date.now() + DEMO_EXPIRES_MS).toISOString()};
    }

    async function demoConfirm(_id: string, code: string): Promise<void> {
        // 미리보기 확인 — 123456 이면 완료
        setSmsResult(code === DEMO_CODE ? '인증 완료' : '인증번호가 일치하지 않습니다.');
    }

    async function demoUpload(file: File): Promise<void> {
        // 미리보기 올리기 — 형식만 보고 브라우저 주소로 붙인다
        if (!imageContentType(file)) {
            showErrorPopup(IMAGE_TYPE_MESSAGE);
            return;
        }

        setImages((prev) => [...prev, {id: crypto.randomUUID(), image_url: URL.createObjectURL(file), alt: file.name}]);
    }

    function demoDelete(id: string): void {
        // 미리보기 삭제 — 브라우저 주소(blob)도 풀어 준다
        const target = images.find((image) => image.id === id);
        if (target) {
            URL.revokeObjectURL(target.image_url);
        }

        setImages((prev) => prev.filter((image) => image.id !== id));
    }

    function demoReorder(ids: Array<string>): void {
        // 미리보기 순서 — 받은 id 순서대로
        setImages((prev) => ids.map((id) => prev.find((image) => image.id === id)).filter((image): image is UploaderImageType => Boolean(image)));
    }

    function openPayment(): void {
        // 미리보기 결제 정보 — 무작위 payment_id · 1,000원 · 5분
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        setPayment({
            payment_id: Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''),
            order_name: '미리보기 결제',
            amount: 1000,
            expires_at: new Date(Date.now() + DEMO_EXPIRES_MS).toISOString(),
        });
    }

    return (
        // 미리보기 화면
        <main className={styles.page}>
            {/* 머리 */}
            <header className={styles.head}>
                <h1 className={styles.title}>공통 인프라 미리보기</h1>
                <p className={styles.desc}>개발 전용 — 실제 API 없이 부품 동작만. 지도 · 주소는 카카오 키, 결제위젯은 토스 테스트 키가 .env.local 에 있어야 뜬다. 운영에서는 404.</p>
            </header>

            {/* 지도 */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>지도 · 내 위치</h2>
                <p className={styles.result}>{locationLabel} · 멈춘 중심 {idleLabel} · 누른 마커 {clickedStore || '-'}</p>
                {center ? (
                    <div className={styles.map}>
                        <StoreMap center={center} markers={markers} onIdle={setIdleCenter} onMarkerClick={setClickedStore} />
                    </div>
                ) : null}
            </section>

            {/* 주소 → 좌표 */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>주소 → 좌표</h2>
                <div><Button onClick={pickAddress}>주소 검색</Button></div>
                <p className={styles.result}>{address ? `${address.zonecode} ${address.address} — ${address.latitude}, ${address.longitude}` : '-'}</p>
            </section>

            {/* 인증번호 */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>인증번호 (확인 코드 {DEMO_CODE})</h2>
                <div className={styles.narrow}>
                    <SmsVerification onSend={demoSend} onConfirm={demoConfirm} />
                </div>
                <p className={styles.result}>{smsResult || '-'}</p>
            </section>

            {/* 사진 — 콘솔 크기 */}
            <section className={styles.section} data-area="console">
                <h2 className={styles.sectionTitle}>사진 올리기 · 순서 · 삭제</h2>
                <ImageUploader images={images} max={5} onUpload={demoUpload} onDelete={demoDelete} onReorder={demoReorder} />
            </section>

            {/* 결제위젯 */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>토스 결제위젯</h2>
                {payment ? (
                    <div className={styles.narrow}>
                        <TossPaymentWidget payment={payment} onExpired={() => setPayment(null)} />
                    </div>
                ) : (
                    <div><Button onClick={openPayment}>결제위젯 그리기(1,000원)</Button></div>
                )}
            </section>
        </main>
    );
}

/**
 * 중심 둘레 예시 업체 3곳
 *
 * @param center 중심
 */
function sampleMarkers(center: MapPointType): Array<MapMarkerType> {
    return [
        {id: 'store-a', title: '예시 업체 A', latitude: center.latitude + 0.004, longitude: center.longitude + 0.003},
        {id: 'store-b', title: '예시 업체 B', latitude: center.latitude - 0.003, longitude: center.longitude + 0.005},
        {id: 'store-c', title: '예시 업체 C', latitude: center.latitude + 0.002, longitude: center.longitude - 0.006},
    ];
}
