# Plan — 이용자 공통 인프라 (Phase 4)

## Feature Summary
- **Feature**: 지도 · 주소→좌표 · 인증번호 · 파일 올리기 · 토스 결제위젯 — 이용자 · 콘솔 화면 여러 곳이 같이 쓰는 공통 부품
- **Entry point**: `COMPONENT · HOOK · MODULE · ROUTE StoreMap · useMyLocation · searchAddressWithCoords · SmsVerification · uploadFile · ImageUploader · TossPaymentWidget · requestTossConfirm · POST /api/payments/confirm`
- **Domain**: infra (spec: `.beaver/output/spec/infra/user-infra-spec.md` · 로드맵 Phase 4 — #9 ~ #13)

---

## Prerequisites
- [x] 패키지 4개 설치(사용자 결정) — `npm install @tosspayments/tosspayments-sdk@2.10.0 @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2`. `/beaver:build` 첫 단계에서 Claude 가 실행하고 `[x]` 로 바꾼다(사용자 결정 2026-11-16 — `package.json` · `package-lock.json` 이 바뀐다).

화면 확인에만 필요한 것(build 를 막지 않음): `.env.local` 의 `NEXT_PUBLIC_DAUM_MAP_API_KEY`(카카오 디벨로퍼스에 `http://localhost:5000` 도메인 등록) · 토스 결제위젯 테스트 키 `NEXT_PUBLIC_TOSS_CLIENT_KEY`(`test_gck_…`) · `TOSS_SECRET_KEY`(`test_gsk_…`) — 사용자가 넣는다(`.env*` 는 읽지 않는다).

---

## File List

| File | Action |
|------|------|
| `package.json` · `package-lock.json` | modified — 패키지 4개(설치 명령이 바꾼다) |
| `.env.example` | modified — `NEXT_PUBLIC_TOSS_CLIENT_KEY` · `TOSS_SECRET_KEY` |
| `.beaver/config.json` | modified — `stack` 의 `axios` → `fetch`, 새 패키지 |
| `src/shared/types/map.ts` | new — `MapPointType` · `MapMarkerType` |
| `src/shared/utils/kakao-map.ts` | new — `loadKakaoMap`(`KakaoMap.tsx` 의 로더를 옮겨 `libraries=services`) |
| `src/shared/components/map/StoreMap.tsx` | new |
| `src/shared/css/map/StoreMap.module.css` | new |
| `src/shared/hooks/useMyLocation.ts` | new |
| `src/shared/components/KakaoMap.tsx` | **deleted** — 호출처 0, `StoreMap` · `kakao-map.ts` 로 |
| `src/shared/utils/address.ts` | modified — `searchAddress` 삭제(호출처 0), `searchAddressWithCoords` 추가 |
| `src/shared/components/sms/SmsVerification.tsx` | new |
| `src/shared/css/sms/SmsVerification.module.css` | new |
| `src/shared/utils/file.ts` | new — `imageContentType` |
| `src/shared/api/upload.ts` | new — `uploadFile` |
| `src/shared/components/upload/ImageUploader.tsx` | new |
| `src/shared/css/upload/ImageUploader.module.css` | new |
| `src/shared/components/payment/TossPaymentWidget.tsx` | new |
| `src/shared/css/payment/TossPaymentWidget.module.css` | new |
| `src/shared/api/payment.ts` | new — `requestTossConfirm` |
| `src/app/api/route-util.ts` | new — `json` · `isSameSiteJson`(token-cookie 에서 옮김) |
| `src/app/api/cookie/token-cookie.ts` | modified — `json` · `isSameSiteJson` 를 옮기고 가져다 쓴다 |
| `src/app/api/cookie/[area]/route.ts` · `[area]/refresh/route.ts` | modified — import 경로 |
| `src/app/api/payments/confirm/toss-confirm.ts` | new — `toConfirmResult` · `isConfirmRequest` · `confirmTossPayment` · 문구 |
| `src/app/api/payments/confirm/route.ts` | new — `POST` |
| `src/app/dev/infra/page.tsx` · `InfraPreviewContent.tsx` | new — 개발 전용 미리보기(지도 · 주소 · 인증번호 · 사진 · 결제위젯) |
| `src/app/css/dev/InfraPreviewContent.module.css` | new |
| `src/test/shared/utils/file.test.ts` | new — TDD |
| `src/test/app/api/payments/confirm/toss-confirm.test.ts` | new — TDD + route |
| `src/test/shared/api/upload.test.ts` | new |
| `src/test/shared/components/sms/SmsVerification.test.tsx` | new |
| `src/test/shared/hooks/useMyLocation.test.ts` | new |
| `src/test/shared/components/upload/ImageUploader.test.tsx` | new |
| `AGENTS.md` · `docs/conventions.md` · `docs/architecture.md` | modified — `KakaoMap.tsx` 근거를 새 파일로 + 새 부품 목록(아래 "문서") |
| `docs/integrations.md` · AGENTS.md "## 외부 연동" · Checklist | new(초안, plan 단계에서 씀) — 지도 · 주소 · 인증번호 · 파일 · 결제 규약 |
| `src/shared/components/Timer.tsx` · `src/shared/api/request.ts` · `src/shared/utils/error-popup.ts` · `src/shared/components/ui/*` | unchanged — 가져다 쓴다 |

---

## Design

### 지도 (#9)

근거: 로더는 `src/shared/components/KakaoMap.tsx:27-46` 그대로(id 로 한 번 · `kakao.maps.load` 대기) + `libraries=services`. 효과 안 콜백은 `Timer` 처럼 `useEffectEvent`(`src/shared/components/Timer.tsx:18`). 렌더 중 `setState` 는 lint(`react-hooks/set-state-in-effect`) 때문에 효과 본문에서 바로 부르지 않고 Promise 뒤에서만.

```ts
// src/shared/types/map.ts
/** 지도 위 한 지점 — WGS84 */
export type MapPointType = {
    latitude: number;  // 위도
    longitude: number; // 경도
};

/** 지도 마커 — 업체 한 곳 */
export type MapMarkerType = MapPointType & {
    id: string;    // 업체 ID — 누르면 onMarkerClick(id)
    title: string; // 업체 이름 — 마우스를 올리면 보인다
};
```

```ts
// src/shared/utils/kakao-map.ts
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 카카오 지도 SDK 전역(타입 패키지 없음)
        kakao: any;
    }
}

const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk';

/**
 * 카카오 지도 SDK 로드 — 페이지에 한 번만 붙이고, 이미 붙어 있으면 로드가 끝나기를 기다린다
 * - autoload=false 로 붙이고 kakao.maps.load 로 연다. libraries=services 로 지오코더(주소 → 좌표)까지 — 지도 · 주소 검색이 같은 스크립트를 쓴다
 */
export function loadKakaoMap(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.kakao?.maps) {
            window.kakao.maps.load(() => resolve());
            return;
        }

        let script = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.id = KAKAO_MAP_SCRIPT_ID;
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_DAUM_MAP_API_KEY}&autoload=false&libraries=services`;
            script.async = true;
            document.head.appendChild(script);
        }

        script.addEventListener('load', () => window.kakao.maps.load(() => resolve()), { once: true });
        script.addEventListener('error', () => reject(new Error('카카오 지도 스크립트를 불러오지 못했습니다.')), { once: true });
    });
}
```

```tsx
// src/shared/components/map/StoreMap.tsx
'use client';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { MapMarkerType, MapPointType } from '@/shared/types/map';
import { loadKakaoMap } from '@/shared/utils/kakao-map';
import styles from '@/shared/css/map/StoreMap.module.css';

/** 카카오 지도 객체 중 쓰는 부분 */
type KakaoMapType = {
    getCenter: () => {getLat: () => number; getLng: () => number};
    setCenter: (latLng: unknown) => void;
    getLevel: () => number;
    setLevel: (level: number) => void;
};

/** 카카오 마커 중 쓰는 부분 */
type KakaoMarkerType = {
    setMap: (map: KakaoMapType | null) => void;
};

type StoreMapProps = {
    center: MapPointType;                    // 지도 중심 — 바뀌면 그쪽으로 옮긴다
    markers: Array<MapMarkerType>;           // 업체 마커
    level?: number;                          // 확대 단계(1 가까움 ~ 14 멂)
    onIdle?: (center: MapPointType) => void; // 지도가 멈추면 — 지금 중심
    onMarkerClick?: (id: string) => void;    // 마커를 누르면 — 업체 ID
};

/** 같은 좌표로 보는 차이 — 이보다 작으면 옮기지 않는다(idle 이 다시 오지 않게) */
const SAME_POINT_EPSILON = 0.0000001;

/**
 * 업체 지도 — 여러 마커 · 멈추면 중심 좌표 알림 · 마커 누름 알림
 * - 높이는 감싼 요소의 CSS 변수 --store-map-h (기본 320px)
 * - idle 은 처음 그릴 때 · center 로 옮겼을 때도 온다 — 화면은 onIdle 에서만 조회하면 된다(onIdle 값을 center 로 되돌려 넣지 않는다)
 * - 한 업체 위치(U2)는 마커 하나 · onIdle 없이
 *
 * @param param0
 * @returns
 */
export default function StoreMap({center, markers, level = 5, onIdle, onMarkerClick}: StoreMapProps): React.ReactNode {
    // 변수
    const {latitude, longitude} = center;                       // 지금 받은 중심
    const containerRef = useRef<HTMLDivElement>(null);          // 지도를 그릴 요소
    const mapRef = useRef<KakaoMapType | null>(null);            // 만든 지도
    const createMap = useEffectEvent((container: HTMLDivElement): KakaoMapType => (
        new window.kakao.maps.Map(container, {center: toLatLng({latitude, longitude}), level})
    ));                                                          // 그때의 center · level 로 지도 만들기(효과를 다시 걸지 않는다)
    const notifyIdle = useEffectEvent((): void => {
        const point = mapRef.current?.getCenter();
        if (point) {
            onIdle?.({latitude: point.getLat(), longitude: point.getLng()});
        }
    });                                                          // 멈춤 알림 — 그때의 onIdle
    const notifyMarkerClick = useEffectEvent((id: string): void => {
        onMarkerClick?.(id);
    });                                                          // 마커 누름 알림 — 그때의 onMarkerClick

    // 상태
    const [mapVersion, setMapVersion] = useState<number>(0); // 지도를 만든 횟수 — 0 이면 아직, 늘면 중심 · 마커 효과가 다시 돈다

    // 효과
    useEffect(() => {
        // SDK 를 불러와 지도를 한 번 만들고 멈춤(idle)을 듣는다
        let cancelled = false;

        loadKakaoMap().then(() => {
            if (cancelled || !containerRef.current) {
                return;
            }

            const map = createMap(containerRef.current);
            window.kakao.maps.event.addListener(map, 'idle', () => notifyIdle());
            mapRef.current = map;
            setMapVersion((version) => version + 1);
        }).catch((error: Error) => {
            console.error(error.message);
        });

        return () => {
            cancelled = true;
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        // center 가 바뀌면 그쪽으로 옮긴다 — 이미 거기면 그대로(idle 이 다시 오지 않게)
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const now = map.getCenter();
        if (Math.abs(now.getLat() - latitude) < SAME_POINT_EPSILON && Math.abs(now.getLng() - longitude) < SAME_POINT_EPSILON) {
            return;
        }

        map.setCenter(toLatLng({latitude, longitude}));
    }, [mapVersion, latitude, longitude]);

    useEffect(() => {
        // level 이 바뀌면 확대 단계를 바꾼다
        const map = mapRef.current;
        if (map && map.getLevel() !== level) {
            map.setLevel(level);
        }
    }, [mapVersion, level]);

    useEffect(() => {
        // 마커를 다시 찍는다 — 이전 마커는 지운다
        const map = mapRef.current;
        if (!map) {
            return;
        }

        const created: Array<KakaoMarkerType> = markers.map((marker) => {
            const kakaoMarker: KakaoMarkerType = new window.kakao.maps.Marker({map, position: toLatLng(marker), title: marker.title, clickable: true});
            window.kakao.maps.event.addListener(kakaoMarker, 'click', () => notifyMarkerClick(marker.id));
            return kakaoMarker;
        });

        return () => {
            created.forEach((kakaoMarker) => kakaoMarker.setMap(null));
        };
    }, [mapVersion, markers]);

    return (
        // 지도 자리 — 높이는 --store-map-h
        <div ref={containerRef} className={styles.map} />
    );
}

/**
 * 좌표 → 카카오 LatLng
 *
 * @param point 좌표
 */
function toLatLng(point: MapPointType): unknown {
    return new window.kakao.maps.LatLng(point.latitude, point.longitude);
}
```

```css
/* src/shared/css/map/StoreMap.module.css */
.map {
    width: 100%;
    height: var(--store-map-h, 320px);
    border-radius: var(--radius);
    background: var(--map-bg);
    overflow: hidden;
}
```

```ts
// src/shared/hooks/useMyLocation.ts
import { useEffect, useState } from 'react';
import { MapPointType } from '@/shared/types/map';

export type UseMyLocationType = {
    location: MapPointType | null; // 내 위치 — 확인 중이면 null
    isDefault: boolean;            // 기본 위치(서울시청)인지 — 거부 · 지원 안 함 · 시간 초과 · 오류
    loading: boolean;              // 확인 중인지
};

type MyLocationType = {
    location: MapPointType; // 읽은 위치 또는 기본 위치
    isDefault: boolean;     // 기본 위치인지
};

/** 위치를 못 읽을 때 — 서울시청 (사용자 결정 2026-11-16) */
export const DEFAULT_LOCATION: MapPointType = {latitude: 37.5665, longitude: 126.978};

/** 위치 읽기 시간 초과 */
const LOCATION_TIMEOUT_MS = 10 * 1000;

/** 이 시간 안에 읽은 위치는 다시 쓴다 */
const LOCATION_MAX_AGE_MS = 60 * 1000;

/**
 * 내 위치 — 위치 권한을 묻고, 못 읽으면 기본 위치(서울시청)
 *
 * @returns
 */
export default function useMyLocation(): UseMyLocationType {
    // 상태
    const [result, setResult] = useState<MyLocationType | null>(null); // 읽은 위치 — 확인 중이면 null

    // 계산 값
    const location = result?.location ?? null;     // 내 위치
    const isDefault = result?.isDefault ?? false;  // 기본 위치인지
    const loading = result === null;               // 확인 중인지

    // 효과
    useEffect(() => {
        // 처음 한 번 위치를 읽는다(사라지면 결과를 버린다)
        let active = true;
        readMyLocation().then((next) => {
            if (active) {
                setResult(next);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    return {location, isDefault, loading};
}

/**
 * 브라우저 위치 읽기 — 실패는 던지지 않고 기본 위치
 */
function readMyLocation(): Promise<MyLocationType> {
    return new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            resolve({location: DEFAULT_LOCATION, isDefault: true});
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve({location: {latitude: position.coords.latitude, longitude: position.coords.longitude}, isDefault: false}),
            () => resolve({location: DEFAULT_LOCATION, isDefault: true}),
            {timeout: LOCATION_TIMEOUT_MS, maximumAge: LOCATION_MAX_AGE_MS},
        );
    });
}
```

### 주소 → 좌표 (#10)

근거: 우편번호 로더 `src/shared/utils/address.ts:20-39` 그대로. 지우는 `searchAddress`(`address.ts:47`)는 호출처 0.

```ts
// src/shared/utils/address.ts — 바뀌는 곳(위 declare global · PostcodeResult · 상수 · loadAddressSearchScript 는 그대로)
import { showErrorPopup } from '@/shared/utils/error-popup';
import { loadKakaoMap } from '@/shared/utils/kakao-map';

/** 주소 검색 결과 — 입점 신청(U11) · 업체 정보 수정(A4)의 주소 · 좌표 칸 */
export type AddressWithCoordsType = {
    zonecode: string;  // 우편번호
    address: string;   // 고른 주소(도로명 또는 지번)
    latitude: number;  // 위도 (WGS84)
    longitude: number; // 경도 (WGS84)
};

/** 고른 주소의 좌표를 못 찾았을 때 */
export const ADDRESS_COORDS_NOT_FOUND_MESSAGE = '주소의 위치를 찾지 못했습니다. 다른 주소로 검색해 주세요.';

// (loadAddressSearchScript 그대로)

/**
 * 주소 검색 → 좌표 — 다음 우편번호 팝업에서 고른 주소를 카카오 지오코더로 위도 · 경도까지
 * - 고르지 않고 닫으면 null, 좌표를 못 찾으면 오류 팝업 후 null
 * - 스크립트를 못 불러오면 Error 를 던진다 — 화면은 catch 에서 handleApiError
 *
 * @returns 주소 · 좌표, 없으면 null
 */
export async function searchAddressWithCoords(): Promise<AddressWithCoordsType | null> {
    await Promise.all([loadAddressSearchScript(), loadKakaoMap()]);

    const picked = await pickAddress();
    if (!picked) {
        return null;
    }

    const coords = await findCoords(picked.address);
    if (!coords) {
        showErrorPopup(ADDRESS_COORDS_NOT_FOUND_MESSAGE);
        return null;
    }

    return {zonecode: picked.zonecode, address: picked.address, ...coords};
}

/**
 * 다음 우편번호 팝업 — 고르면 그 결과, 닫으면 null(닫힐 때 끝난다)
 */
function pickAddress(): Promise<PostcodeResult | null> {
    return new Promise((resolve) => {
        let picked: PostcodeResult | null = null;
        new window.daum.Postcode({
            oncomplete: (data: PostcodeResult) => {
                picked = data;
            },
            onclose: () => resolve(picked),
        }).open();
    });
}

/**
 * 카카오 지오코더 — 주소의 첫 결과 좌표(y 위도 · x 경도, 문자열 → 숫자)
 *
 * @param address 주소
 */
function findCoords(address: string): Promise<{latitude: number; longitude: number} | null> {
    return new Promise((resolve) => {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result: Array<{x: string; y: string}>, status: string) => {
            if (status !== window.kakao.maps.services.Status.OK || result.length === 0) {
                resolve(null);
                return;
            }

            const latitude = Number(result[0].y);
            const longitude = Number(result[0].x);
            resolve(Number.isFinite(latitude) && Number.isFinite(longitude) ? {latitude, longitude} : null);
        });
    });
}

// 삭제: export async function searchAddress(zip?, addr1?) — 호출처 0
```

### 인증번호 흐름 (#11)

근거: 시안 `frontend/design/user.html:935-954`(번호 + "다시 받기", 칸 안 오른쪽 남은 시간, 안내 문구), `Timer`(`src/shared/components/Timer.tsx:16` — `time` 이 바뀌면 다시 셈 · 다 되면 `closeFunc` 한 번), `Field` 오류 span(`src/shared/components/ui/form/Field.tsx:37`).

```tsx
// src/shared/components/sms/SmsVerification.tsx
'use client';
import { ChangeEvent, useId, useState } from 'react';
import Timer from '@/shared/components/Timer';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import styles from '@/shared/css/sms/SmsVerification.module.css';

/** 인증번호 발송 결과 — 이용자 · 매니저 발송 API 의 done(…ResultDto 와 같은 모양) */
export type SmsSentType = {
    sms_verification_id: string; // 인증 ID — 확인할 때 인증번호와 함께
    expires_at: string;          // 인증번호 만료 시각(ISO 8601 — 발송 후 5분)
};

type SmsVerificationProps = {
    onSend: (phone: string) => Promise<SmsSentType | null>;                 // 발송 — 화면이 DTO 검증 · API · 실패 안내, 못 보냈으면 null
    onConfirm: (sms_verification_id: string, code: string) => Promise<void>; // 확인 — 결과 처리(다음 화면 · 오류)는 화면이
    confirmLabel?: string;                                                   // 확인 버튼 글자
    children?: React.ReactNode;                                              // 번호 위에 둘 칸(비밀번호 초기화의 아이디 등)
};

/** 보낸 뒤 안내 */
export const SMS_SENT_MESSAGE = '인증번호를 보냈어요. 5분 안에 입력해 주세요.';

/** 남은 시간이 다 됐을 때 */
export const SMS_EXPIRED_MESSAGE = '인증번호가 만료되었습니다. 다시 받아 주세요.';

/** 아래 안내 — 시안 그대로 */
const SMS_NOTICE = '인증번호는 받은 뒤 5분 동안 쓸 수 있어요. 여러 번 틀렸거나 시간이 지나면 다시 받아 주세요. 하루에 받을 수 있는 횟수가 정해져 있어요.';

/**
 * 인증번호 흐름 — 번호 → 받기 → 6자리 + 남은 시간 → 확인
 * - 입력 칸은 Field name="phone" · name="code" — 화면 DTO 검증 오류가 칸 옆에 나온다
 *
 * @param param0
 * @returns
 */
export default function SmsVerification({onSend, onConfirm, confirmLabel = '인증하기', children}: SmsVerificationProps): React.ReactNode {
    // 변수
    const phoneId = useId(); // 번호 칸 id — 라벨이 가리킨다
    const codeId = useId();  // 인증번호 칸 id

    // 상태
    const [phone, setPhone] = useState<string>('');             // 휴대폰 번호(숫자만)
    const [code, setCode] = useState<string>('');               // 인증번호(숫자 6자리까지)
    const [sent, setSent] = useState<SmsSentType | null>(null); // 받은 인증 — 없으면 아직 안 보냄
    const [expired, setExpired] = useState<boolean>(false);     // 남은 시간이 다 됐는지
    const [busy, setBusy] = useState<boolean>(false);           // 보내는 중 · 확인 중 — 두 번 누름 막기

    // 계산 값
    const canConfirm = sent !== null && !expired && !busy; // 확인 버튼을 누를 수 있는지

    // 함수
    function changePhone(event: ChangeEvent<HTMLInputElement>): void {
        // 숫자만 11자리까지 — 번호가 바뀌면 받은 인증번호를 비운다(다시 받아야 함)
        setPhone(event.target.value.replace(/\D/g, '').slice(0, 11));
        setSent(null);
        setCode('');
        setExpired(false);
    }

    function changeCode(event: ChangeEvent<HTMLInputElement>): void {
        // 숫자만 6자리까지
        setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
    }

    async function send(): Promise<void> {
        // 발송 — 결과가 있을 때만 인증번호 칸을 연다(null 이면 화면이 이미 안내함)
        setBusy(true);
        try {
            const result = await onSend(phone);
            if (result) {
                setSent(result);
                setCode('');
                setExpired(false);
            }
        } finally {
            setBusy(false);
        }
    }

    async function confirm(): Promise<void> {
        // 확인 — 결과 처리는 화면이
        if (!sent || expired) {
            return;
        }

        setBusy(true);
        try {
            await onConfirm(sent.sms_verification_id, code);
        } finally {
            setBusy(false);
        }
    }

    function expire(): void {
        // 남은 시간이 다 됨 — 확인을 막는다
        setExpired(true);
    }

    return (
        // 인증번호 흐름
        <div className={styles.sms}>
            {/* 번호 위 칸(아이디 등) */}
            {children}

            {/* 휴대폰 번호 · 받기 */}
            <Field label="휴대폰 번호" name="phone" htmlFor={phoneId}>
                <div className={styles.row}>
                    <Input id={phoneId} type="tel" inputMode="numeric" autoComplete="tel" placeholder="01012345678" value={phone} onChange={changePhone} />
                    <Button onClick={send} disabled={busy}>{sent ? '다시 받기' : '인증번호 받기'}</Button>
                </div>
                {sent ? <p className={styles.sent}>{SMS_SENT_MESSAGE}</p> : null}
            </Field>

            {/* 인증번호 · 남은 시간 */}
            {sent ? (
                <Field label="인증번호" name="code" htmlFor={codeId}>
                    <div className={styles.codeBox}>
                        <Input id={codeId} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={changeCode} />
                        <span className={styles.timer}><Timer time={sent.expires_at} closeFunc={expire} /></span>
                    </div>
                    {expired ? <p className={styles.expired} role="alert">{SMS_EXPIRED_MESSAGE}</p> : null}
                </Field>
            ) : null}

            {/* 안내 */}
            <p className={styles.notice}>{SMS_NOTICE}</p>

            {/* 확인 */}
            {sent ? <Button variant="primary" size="lg" full onClick={confirm} disabled={!canConfirm}>{confirmLabel}</Button> : null}
        </div>
    );
}
```

```css
/* src/shared/css/sms/SmsVerification.module.css — 시안 user.html:935-954 */
.sms {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.row {
    display: flex;
    gap: 8px;
}

.row > input {
    flex: 1;
    min-width: 0;
    font-variant-numeric: tabular-nums;
}

.sent {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--ok);
}

.codeBox {
    position: relative;
}

.codeBox > input {
    width: 100%;
    padding-right: 72px;
    letter-spacing: 2px;
    font-variant-numeric: tabular-nums;
}

.timer {
    position: absolute;
    top: 50%;
    right: 14px;
    transform: translateY(-50%);
    font-size: 14px;
    font-weight: 700;
    color: var(--danger);
    font-variant-numeric: tabular-nums;
}

.expired {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--danger);
}

.notice {
    margin: 0;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--surface-2);
    font-size: 13px;
    line-height: 1.6;
    color: var(--muted);
}
```

화면 쪽 쓰는 모양(Phase 5 · 10 — 참고, 이번에 만들지 않음):

```tsx
// 예: src/app/(user)/phone-verification/PhoneVerificationContent.tsx 안
async function send(phone: string): Promise<SmsSentType | null> {
    const dto = Object.assign(new UserPhoneVerificationDto(), {phone});
    if (!(await validateAction(dto))) {
        return null;
    }

    try {
        const result = await sendPhoneVerification(auth, dto); // contracts — withAuth + callQueue
        if (!result) {
            showErrorPopup(QUEUE_PENDING_MESSAGE); // 큐 pending — 잠시 뒤 다시 받기
        }
        return result;
    } catch (error) {
        handleApiError(error);
        return null;
    }
}

<SmsVerification onSend={send} onConfirm={confirm} />
```

### 파일 올리기 (#12)

근거: api.md "파일 · 사진 올리기" 3단계, DTO `StoreMineFileUploadUrlDto` · `StoreMineFileDto`(frontend/dto/store.md:757-800 — `content_type` 은 `image/jpeg` · `image/png`, 같은 값으로 PUT), 시안 `frontend/design/manager.html:157-161,1055-1060`. `ApiError` · `sendRequest`(`src/shared/api/request.ts:36,89`). 렌더 중 목록 맞추기는 `useCheckboxGroup.ts:27-32` 와 같은 방식.

```ts
// src/shared/utils/file.ts
/** 올릴 수 있는 사진 형식 — 업로드 주소 발급 · 등록 DTO 의 content_type */
export type ImageMimeType = 'image/jpeg' | 'image/png';

const IMAGE_MIME_TYPES: Array<ImageMimeType> = ['image/jpeg', 'image/png'];

/** MIME 이 비어 있을 때 확장자로 */
const IMAGE_EXTENSIONS: Record<string, ImageMimeType> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
};

/**
 * 사진 형식 — JPG · PNG 면 그 MIME, 아니면 null
 * - MIME 이 있으면 MIME 을 따른다(확장자만 바꾼 파일은 막힘), 비어 있으면 확장자(대소문자 무시)
 *
 * @param file 고른 파일
 */
export function imageContentType(file: Pick<File, 'type' | 'name'>): ImageMimeType | null {
    if (file.type) {
        return (IMAGE_MIME_TYPES as Array<string>).includes(file.type) ? (file.type as ImageMimeType) : null;
    }

    const dot = file.name.lastIndexOf('.');
    const extension = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
    return IMAGE_EXTENSIONS[extension] ?? null;
}
```

```ts
// src/shared/api/upload.ts
import { ApiError, sendRequest } from '@/shared/api/request';
import { ImageMimeType, imageContentType } from '@/shared/utils/file';

/** 업로드 주소 발급 결과 — …UploadUrlResultDto 와 같은 모양 */
export type UploadUrlType = {
    file_key: string;   // 저장 키 — 등록 때 보낸다
    upload_url: string; // 업로드 주소(PUT, 10분)
    expires_at: string; // 업로드 주소 만료(ISO 8601)
};

/** 등록 API 에 넘길 값 — …FileDto · …ImageDto 의 공통 칸 */
export type UploadedFileType = {
    file_key: string;
    file_name: string;
    content_type: ImageMimeType;
};

/** 화면이 넘기는 두 API — 그 도메인 contracts 함수로 감싼다 */
export type UploadStepsType<T> = {
    issue: (content_type: ImageMimeType) => Promise<UploadUrlType | null>; // 업로드 주소 발급(동기)
    register: (file: UploadedFileType) => Promise<T | null>;               // 등록(큐) — pending 이면 null
};

/** 형식이 JPG · PNG 가 아닐 때 — DTO 메시지와 같다 */
export const IMAGE_TYPE_MESSAGE = 'JPG · PNG 사진만 올릴 수 있습니다.';

/** 업로드 주소를 못 받았거나 S3 가 거절했을 때 */
export const UPLOAD_FAIL_MESSAGE = '사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.';

/**
 * 사진 올리기 — 형식 확인 → 업로드 주소 발급 → S3 로 PUT → 등록
 * - 형식이 아니면 ApiError(400), 업로드 주소가 없거나 PUT 이 2xx 가 아니면 ApiError(그 상태) — 다음 단계를 부르지 않는다
 * - 응답 없는 실패는 NetworkError. 화면은 catch 에서 handleApiError
 *
 * @param file 고른 파일
 * @param steps 업로드 주소 발급 · 등록 API
 * @returns 등록 결과(큐 pending 이면 null → 화면이 목록을 다시 조회)
 */
export async function uploadFile<T>(file: File, {issue, register}: UploadStepsType<T>): Promise<T | null> {
    const content_type = imageContentType(file);
    if (!content_type) {
        throw new ApiError(400, {message: IMAGE_TYPE_MESSAGE, validation_errors: null});
    }

    const issued = await issue(content_type);
    if (!issued) {
        throw new ApiError(500, {message: UPLOAD_FAIL_MESSAGE, validation_errors: null});
    }

    const response = await sendRequest(issued.upload_url, {method: 'PUT', headers: {'Content-Type': content_type}, body: file});
    if (!response.ok) {
        throw new ApiError(response.status, {message: UPLOAD_FAIL_MESSAGE, validation_errors: null});
    }

    return register({file_key: issued.file_key, file_name: file.name, content_type});
}
```

```tsx
// src/shared/components/upload/ImageUploader.tsx
'use client';
import Image from 'next/image';
import { ChangeEvent, useId, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import styles from '@/shared/css/upload/ImageUploader.module.css';

/** 사진 한 장 — 화면이 응답(image_url · file_url)으로 만든다 */
export type UploaderImageType = {
    id: string;        // 사진 ID — 삭제 · 순서 API 에 보낸다
    image_url: string; // 보여 줄 주소
    alt: string;       // 대체 글 · 버튼 이름에 쓴다
};

type ImageUploaderProps = {
    images: Array<UploaderImageType>;         // 지금 사진(순서대로 — 첫 장이 대표)
    max?: number;                             // 최대 장수
    onUpload: (file: File) => Promise<void>;  // 고른 파일 — 화면이 uploadFile · 다시 조회
    onDelete: (id: string) => void;           // 삭제 — 확인 모달은 화면이
    onReorder?: (ids: Array<string>) => void; // 순서 바꿈(id 전부) — 없으면 끌기 없음
    disabled?: boolean;                       // 전부 막기(권한 없음 · 처리 중)
};

type SortableThumbProps = {
    image: UploaderImageType;       // 사진
    index: number;                  // 순서(0 이 대표)
    sortable: boolean;              // 손잡이를 보일지
    disabled: boolean;              // 삭제 막기
    onDelete: (id: string) => void; // 삭제
};

/**
 * 사진 목록 · 올리기 — 첫 장 "대표", 손잡이로 순서 끌기(마우스 · 키보드), 삭제, "사진 올리기"(JPG · PNG, max 장까지)
 *
 * @param param0
 * @returns
 */
export default function ImageUploader({images, max = 5, onUpload, onDelete, onReorder, disabled = false}: ImageUploaderProps): React.ReactNode {
    // 변수
    const dndId = useId(); // 끌기 안내 요소 id — 서버 · 브라우저 렌더가 같게
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    ); // 마우스(4px 넘게 움직이면 끌기) · 키보드(손잡이에서 스페이스 · 방향키)

    // 상태
    const [order, setOrder] = useState<Array<string>>(() => images.map((image) => image.id)); // 보이는 순서 — 놓자마자 바뀌게
    const [prevImages, setPrevImages] = useState<Array<UploaderImageType>>(images);           // 직전 images — 바뀌면 순서를 맞춘다
    const [uploading, setUploading] = useState<boolean>(false);                               // 올리는 중

    // images 가 바뀌면(다시 조회) 보이는 순서를 맞춘다 — 렌더 중에 맞춘다(effect 로 하면 한 번 더 그린다)
    if (images !== prevImages) {
        setPrevImages(images);
        setOrder(images.map((image) => image.id));
    }

    // 계산 값
    const sorted = order
        .map((id) => images.find((image) => image.id === id))
        .filter((image): image is UploaderImageType => Boolean(image));  // 보이는 순서의 사진
    const sortable = Boolean(onReorder) && !disabled && sorted.length > 1; // 끌기를 켤지
    const canUpload = sorted.length < max;                                 // 더 올릴 수 있는지

    // 함수
    async function chooseFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        // 고른 파일 한 장을 화면에 넘긴다 — 같은 파일을 다시 고를 수 있게 칸을 비운다
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }

        setUploading(true);
        try {
            await onUpload(file);
        } finally {
            setUploading(false);
        }
    }

    function endDrag(event: DragEndEvent): void {
        // 놓은 자리로 순서를 바꾸고 화면에 id 전부를 넘긴다
        const {active, over} = event;
        if (!over || active.id === over.id) {
            return;
        }

        const next = arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id)));
        setOrder(next);
        onReorder?.(next);
    }

    return (
        // 사진 목록 · 올리기
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={endDrag}>
            <SortableContext items={order} strategy={rectSortingStrategy} disabled={!sortable}>
                <div className={styles.thumbs}>
                    {/* 사진 — 첫 장이 대표 */}
                    {sorted.map((image, index) => (
                        <SortableThumb key={image.id} image={image} index={index} sortable={sortable} disabled={disabled} onDelete={onDelete} />
                    ))}

                    {/* 올리기 칸 — max 장이면 숨김 */}
                    {canUpload ? (
                        <label className={styles.upload} aria-disabled={uploading || disabled}>
                            <input type="file" accept="image/jpeg,image/png" className={styles.file} onChange={chooseFile} disabled={uploading || disabled} />
                            <span>{uploading ? '올리는 중…' : '사진 올리기'}</span>
                            <small className={styles.uploadHint}>JPG · PNG, {max}장까지</small>
                        </label>
                    ) : null}
                </div>
            </SortableContext>
        </DndContext>
    );
}

/**
 * 사진 한 장 — 손잡이 · 순번(첫 장 "대표") · 삭제
 *
 * @param param0
 * @returns
 */
function SortableThumb({image, index, sortable, disabled, onDelete}: SortableThumbProps): React.ReactNode {
    // 변수
    const {attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging} = useSortable({id: image.id}); // 끌기 — 손잡이에만 붙인다
    const dragStyle = {transform: CSS.Transform.toString(transform), transition};                   // 끄는 동안 위치(@dnd-kit 이 계산 — 인라인만 가능)
    const classNames = [styles.thumb, isDragging ? styles.dragging : ''].filter(Boolean).join(' '); // 사진 · 끄는 중

    return (
        // 사진 한 장
        <figure ref={setNodeRef} style={dragStyle} className={classNames}>
            {/* 사진 — 원격(CDN · S3) 주소라 최적화 없이 */}
            <div className={styles.image}>
                <Image src={image.image_url} alt={image.alt} fill sizes="176px" unoptimized className={styles.img} />
            </div>

            {/* 손잡이 · 순번 · 삭제 */}
            <figcaption className={styles.caption}>
                {sortable ? (
                    <button type="button" ref={setActivatorNodeRef} className={buttonClass({size: 'sm', icon: true})} aria-label={`${image.alt} 순서 옮기기`} {...attributes} {...listeners}>
                        ⋮⋮
                    </button>
                ) : <span />}
                {index === 0 ? <Badge tone="primary">대표</Badge> : <span>{index + 1}</span>}
                <Button size="sm" icon variant="danger" aria-label={`${image.alt} 삭제`} onClick={() => onDelete(image.id)} disabled={disabled}>✕</Button>
            </figcaption>
        </figure>
    );
}
```

```css
/* src/shared/css/upload/ImageUploader.module.css — 시안 manager.html:157-161 */
.thumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.thumb {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 176px;
    max-width: 100%;
    margin: 0;
    background: var(--surface);
}

.dragging {
    position: relative;
    z-index: 1;
    opacity: 0.6;
}

.image {
    position: relative;
    aspect-ratio: 4 / 3;
    border-radius: var(--radius);
    background: var(--surface-2);
    overflow: hidden;
}

.img {
    object-fit: cover;
}

.caption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-size: 12px;
    color: var(--muted);
}

.upload {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 176px;
    max-width: 100%;
    aspect-ratio: 4 / 3;
    border: 1px dashed var(--faint);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: 13px;
    color: var(--fg);
    cursor: pointer;
}

.upload[aria-disabled="true"] {
    color: var(--muted);
    cursor: default;
}

.upload:focus-within {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}

.uploadHint {
    font-size: 12px;
    color: var(--muted);
}

/* 파일 칸은 보이지 않게 두고 라벨로 연다(키보드 초점은 받는다) */
.file {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
}
```

화면 쪽 쓰는 모양(Phase 9 · 11 · 12 — 참고):

```tsx
// 예: M7 사진 탭
async function upload(file: File): Promise<void> {
    try {
        await uploadFile(file, {
            issue: (content_type) => issueStoreFileUploadUrl(auth, {content_type}),
            register: (uploaded) => registerStoreFile(auth, uploaded),
        });
    } catch (error) {
        handleApiError(error);
    }
    await reload(); // 성공 · pending · 실패 모두 목록을 다시 조회
}

<ImageUploader images={images} max={5} onUpload={upload} onDelete={askDelete} onReorder={saveOrder} />
```

### 토스 결제위젯 (#13)

근거: 사용자 결정(결제위젯 · npm SDK · `ANONYMOUS`), 토스 v2 SDK(`loadTossPayments` → `widgets` → `setAmount` → `renderPaymentMethods` · `renderAgreement` → `requestPayment`), api.md "결제" 1~2단계, DTO `ReservationResultDto`(frontend/dto/reservation.md:865 — `payment_id` · `order_name` · `amount` · `expires_at`). SDK 는 효과 안에서 `import()` 로 불러 서버 렌더에 들어가지 않게(AGENTS.md Key Patterns "window 를 쓰는 라이브러리").

```tsx
// src/shared/components/payment/TossPaymentWidget.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import Timer from '@/shared/components/Timer';
import Button from '@/shared/components/ui/button/Button';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { formatPrice } from '@/shared/utils/format';
import styles from '@/shared/css/payment/TossPaymentWidget.module.css';

/** 토스 SDK 모듈 */
type TossSdkType = typeof import('@tosspayments/tosspayments-sdk');

/** 결제위젯 — loadTossPayments(…).widgets(…) */
type TossWidgetsType = ReturnType<Awaited<ReturnType<TossSdkType['loadTossPayments']>>['widgets']>;

/** 그린 위젯(결제수단 · 약관) — destroy() 로 지운다 */
type TossRenderedType = {destroy: () => Promise<void>};

/** 결제 정보 — 예약 생성 · 연장 신청 done(ReservationResultDto · ReservationExtendResultDto) */
export type TossPaymentType = {
    payment_id: string; // 결제 ID — 토스 orderId
    order_name: string; // 주문명 — 토스 orderName
    amount: number;     // 결제 금액(원)
    expires_at: string; // 결제 마감(ISO 8601 — 5분)
};

type TossPaymentWidgetProps = {
    payment: TossPaymentType; // 결제 정보
    onExpired?: () => void;   // 결제 마감이 지나면
};

/** 결제위젯 연동 클라이언트 키(빌드 때 박힌다) */
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';

/** 사용자가 결제창을 닫음 — 조용히 */
const USER_CANCEL_CODE = 'USER_CANCEL';

export const PAYMENT_EXPIRED_MESSAGE = '결제 시간이 지났습니다. 다시 예약해 주세요.';
export const PAYMENT_CONFIG_MESSAGE = '결제 설정이 없습니다.';
const PAYMENT_LOAD_FAIL_MESSAGE = '결제 화면을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
const PAYMENT_REQUEST_FAIL_MESSAGE = '결제를 시작하지 못했습니다. 잠시 뒤 다시 시도해 주세요.';

/**
 * 토스 결제위젯 — 결제 마감 남은 시간 · 결제수단 · 약관 · "결제하기"
 * - 결제창 성공 · 실패는 /payments/success/ · /payments/fail/ 로 돌아온다(basePath 포함)
 *
 * @param param0
 * @returns
 */
export default function TossPaymentWidget({payment, onExpired}: TossPaymentWidgetProps): React.ReactNode {
    // 변수
    const methodsRef = useRef<HTMLDivElement>(null);         // 결제수단 위젯 자리
    const agreementRef = useRef<HTMLDivElement>(null);       // 약관 위젯 자리
    const widgetsRef = useRef<TossWidgetsType | null>(null); // 그린 결제위젯 — "결제하기" 가 쓴다

    // 상태
    const [ready, setReady] = useState<boolean>(false);           // 결제수단 · 약관을 다 그렸는지
    const [expired, setExpired] = useState<boolean>(false);       // 결제 마감이 지났는지
    const [requesting, setRequesting] = useState<boolean>(false); // 결제창을 여는 중

    // 계산 값
    const canPay = ready && !expired && !requesting; // "결제하기" 를 누를 수 있는지

    // 효과
    useEffect(() => {
        // 결제위젯을 불러와 금액 · 결제수단 · 약관을 그린다 — 효과마다 새 자리에 그리고(개발 모드 두 번 실행에도 겹치지 않게), 사라지면 지운다
        const methodsBox = methodsRef.current;
        const agreementBox = agreementRef.current;
        if (!TOSS_CLIENT_KEY || !methodsBox || !agreementBox) {
            return;
        }

        let cancelled = false;
        const methodsTarget = appendWidgetTarget(methodsBox, 'toss-methods');
        const agreementTarget = appendWidgetTarget(agreementBox, 'toss-agreement');
        const rendered: Array<TossRenderedType> = [];
        const task = renderWidgets(payment.amount, methodsTarget.id, agreementTarget.id, rendered);

        task.then((widgets) => {
            if (!cancelled) {
                widgetsRef.current = widgets;
                setReady(true);
            }
        }).catch((error: unknown) => {
            if (!cancelled) {
                console.error(error);
                showErrorPopup(PAYMENT_LOAD_FAIL_MESSAGE);
            }
        });

        return () => {
            cancelled = true;
            widgetsRef.current = null;
            task.catch((): null => null)
                .then(() => Promise.all(rendered.map((widget) => widget.destroy())))
                .catch((): null => null)
                .finally(() => {
                    methodsTarget.remove();
                    agreementTarget.remove();
                });
        };
    }, [payment.amount]);

    // 함수
    async function pay(): Promise<void> {
        // 결제창 열기 — 창을 닫은 것(USER_CANCEL)은 조용히, 그 밖은 오류 팝업
        const widgets = widgetsRef.current;
        if (!widgets || !canPay) {
            return;
        }

        setRequesting(true);
        try {
            await widgets.requestPayment({
                orderId: payment.payment_id,
                orderName: payment.order_name,
                successUrl: paymentResultUrl('success'),
                failUrl: paymentResultUrl('fail'),
            });
        } catch (error) {
            if (errorField(error, 'code') !== USER_CANCEL_CODE) {
                showErrorPopup(errorField(error, 'message') ?? PAYMENT_REQUEST_FAIL_MESSAGE);
            }
        } finally {
            setRequesting(false);
        }
    }

    function expire(): void {
        // 결제 마감 — "결제하기" 를 막고 화면에 알린다
        setExpired(true);
        onExpired?.();
    }

    if (!TOSS_CLIENT_KEY) {
        return (
            // 결제 설정 없음
            <p className={styles.notice} role="alert">{PAYMENT_CONFIG_MESSAGE}</p>
        );
    }

    return (
        // 결제위젯
        <div className={styles.widget}>
            {/* 결제 마감 남은 시간 */}
            <p className={styles.deadline}>
                결제 마감까지 <strong className={styles.time}><Timer time={payment.expires_at} closeFunc={expire} /></strong>
            </p>

            {/* 결제수단 · 약관 — 토스가 그린다 */}
            <div ref={methodsRef} />
            <div ref={agreementRef} />

            {/* 마감 안내 */}
            {expired ? <p className={styles.notice} role="alert">{PAYMENT_EXPIRED_MESSAGE}</p> : null}

            {/* 결제하기 */}
            <Button variant="primary" size="lg" full onClick={pay} disabled={!canPay}>
                {formatPrice(payment.amount)} 결제하기
            </Button>
        </div>
    );
}

/**
 * 결제위젯 불러와 그리기 — 그린 위젯은 rendered 에 담는다(지울 때 쓴다)
 *
 * @param amount 결제 금액
 * @param methodsId 결제수단 자리 id
 * @param agreementId 약관 자리 id
 * @param rendered 그린 위젯을 담을 배열
 */
async function renderWidgets(amount: number, methodsId: string, agreementId: string, rendered: Array<TossRenderedType>): Promise<TossWidgetsType> {
    const {ANONYMOUS, loadTossPayments} = await import('@tosspayments/tosspayments-sdk');
    const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
    const widgets = tossPayments.widgets({customerKey: ANONYMOUS});

    await widgets.setAmount({currency: 'KRW', value: amount});
    rendered.push(await widgets.renderPaymentMethods({selector: `#${methodsId}`, variantKey: 'DEFAULT'}));
    rendered.push(await widgets.renderAgreement({selector: `#${agreementId}`, variantKey: 'AGREEMENT'}));
    return widgets;
}

/**
 * 위젯을 그릴 빈 자리 — 효과마다 새 id
 *
 * @param box 자리를 넣을 요소
 * @param prefix id 앞부분
 */
function appendWidgetTarget(box: HTMLElement, prefix: string): HTMLDivElement {
    const target = document.createElement('div');
    target.id = `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    box.appendChild(target);
    return target;
}

/**
 * 결제창이 돌아올 주소 — origin + basePath + /payments/<결과>/
 *
 * @param result success · fail
 */
function paymentResultUrl(result: 'success' | 'fail'): string {
    return `${window.location.origin}${process.env.NEXT_PUBLIC_LOCAL_SERVER_PREFIX ?? ''}/payments/${result}/`;
}

/**
 * 토스 SDK 오류의 code · message
 *
 * @param error catch 로 받은 값
 * @param key code · message
 */
function errorField(error: unknown, key: 'code' | 'message'): string | null {
    const value = typeof error === 'object' && error !== null ? (error as Record<string, unknown>)[key] : null;
    return typeof value === 'string' ? value : null;
}
```

```css
/* src/shared/css/payment/TossPaymentWidget.module.css */
.widget {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.deadline {
    margin: 0;
    font-size: 14px;
    color: var(--muted);
}

.time {
    color: var(--danger);
    font-variant-numeric: tabular-nums;
}

.notice {
    margin: 0;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--danger-soft);
    font-size: 13px;
    color: var(--danger);
}
```

### 결제 승인 중계 — route handler (#13)

근거: api.md "결제" 3단계("성공 주소에서 프론트 서버가 토스 결제 승인 API(시크릿 키)를 부른다"), 토스 `POST /v1/payments/confirm`(Basic `base64(시크릿 키:)` · `Idempotency-Key` · 본문 `{paymentKey, orderId, amount}`), 백엔드 대조 · 환불(`deskless-backend` `apps/user-service/src/reservation/reservation.service.ts:366-371`). route 응답 · 같은 사이트 검사는 쿠키 route 와 같다(`src/app/api/cookie/token-cookie.ts:66,176`) — 두 곳이 쓰게 되어 `route-util.ts` 로 옮긴다. route 파일은 Next.js 가 허용한 이름(`POST` 등)만 export 하므로 상수 · 함수는 `toss-confirm.ts` 에.

```ts
// src/app/api/route-util.ts — token-cookie.ts 에서 옮김(내용 그대로 + message · code)
/** route handler 응답 본문 — 항상 200 */
export type RouteBodyType = {
    success: boolean;
    data?: unknown;
    retry?: boolean;   // 일시 실패 — 쿠키 · 결제를 그대로 두고 다시 시도
    message?: string;  // 화면에 보일 실패 문구(결제 승인)
    code?: string;     // 외부 오류 코드(토스)
};

/**
 * route handler 응답 — 항상 200 + JSON
 *
 * @param body 응답 본문
 */
export function json(body: RouteBodyType): Response {
    return new Response(JSON.stringify(body), {headers: {'Content-Type': 'application/json'}});
}

/**
 * 같은 사이트의 JSON 요청인지 — 다른 사이트 form 이 토큰을 심거나 승인을 부르는 것 막기
 *
 * @param request route handler 요청
 */
export function isSameSiteJson(request: Request): boolean {
    const contentType = request.headers.get('content-type') ?? '';
    const fetchSite = request.headers.get('sec-fetch-site');
    return contentType.includes('application/json') && (fetchSite === null || fetchSite === 'same-origin');
}
```

```ts
// src/app/api/cookie/token-cookie.ts — 바뀌는 곳
import { json } from '../route-util';
// 삭제: export function json(…) · export function isSameSiteJson(…) — route-util.ts 로

// src/app/api/cookie/[area]/route.ts — import 만
import { isSameSiteJson, json } from '../../route-util';
import { accessCookieName, clearTokenCookies, isTokenSet, refreshAndStore, refreshResponse, setTokenCookies, toArea, TokenSetType } from '../token-cookie';

// src/app/api/cookie/[area]/refresh/route.ts — import 만
import { json } from '../../../route-util';
import { refreshAndStore, refreshResponse, toArea } from '../../token-cookie';
```

```ts
// src/app/api/payments/confirm/toss-confirm.ts
/** 토스 결제 승인 API */
export const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

export const CONFIRM_FAIL_MESSAGE = '결제를 승인하지 못했습니다.';
export const CONFIRM_RETRY_MESSAGE = '결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요.';
export const CONFIRM_INVALID_MESSAGE = '결제 정보가 올바르지 않습니다.';
export const CONFIRM_LOGIN_MESSAGE = '로그인이 필요합니다.';
export const CONFIRM_CONFIG_MESSAGE = '결제 설정이 없습니다.';

/** 같은 결제를 이미 승인함(새로고침 · 다시 승인) — 성공으로 본다 */
const ALREADY_PROCESSED_CODE = 'ALREADY_PROCESSED_PAYMENT';

/** 우리 결제 ID(토스 orderId) — 32자 소문자 hex */
const PAYMENT_ID_PATTERN = /^[a-f0-9]{32}$/;

/** 성공 주소 query — 토스가 붙여 준 값 */
export type ConfirmRequestType = {
    paymentKey: string; // 토스 결제 키(200자까지)
    orderId: string;    // 우리 payment_id
    amount: number;     // 결제 금액(원)
};

/** 승인 결과 — ok / fail(다시 결제) / retry(잠시 뒤 다시 승인) */
export type ConfirmResultType =
    | {state: 'ok'}
    | {state: 'fail'; code?: string; message: string}
    | {state: 'retry'; message: string};

/**
 * 토스 승인 응답 정리 — 200 · 이미 처리됨은 성공, 401 · 403(키 문제)은 일반 문구, 그 밖 4xx 는 토스 문구, 5xx · 응답 없음은 retry
 *
 * @param status 토스 응답 상태, 응답이 없으면 null
 * @param body 토스 응답 본문(JSON 이 아니면 null)
 */
export function toConfirmResult(status: number | null, body: unknown): ConfirmResultType {
    if (status === null || status >= 500) {
        return {state: 'retry', message: CONFIRM_RETRY_MESSAGE};
    }

    if (status >= 200 && status < 300) {
        return {state: 'ok'};
    }

    const fail = (typeof body === 'object' && body !== null ? body : {}) as {code?: unknown; message?: unknown};
    const code = typeof fail.code === 'string' ? fail.code : undefined;
    if (code === ALREADY_PROCESSED_CODE) {
        return {state: 'ok'};
    }

    const message = status === 401 || status === 403 || typeof fail.message !== 'string' ? CONFIRM_FAIL_MESSAGE : fail.message;
    return code ? {state: 'fail', code, message} : {state: 'fail', message};
}

/**
 * 성공 주소 query 검사 — paymentKey 1~200자 · orderId 32자 hex · amount 양의 정수
 *
 * @param body 요청 본문
 */
export function isConfirmRequest(body: Partial<ConfirmRequestType> | null): body is ConfirmRequestType {
    return typeof body?.paymentKey === 'string' && body.paymentKey.length > 0 && body.paymentKey.length <= 200
        && typeof body.orderId === 'string' && PAYMENT_ID_PATTERN.test(body.orderId)
        && Number.isInteger(body.amount) && body.amount > 0;
}

/**
 * 토스 결제 승인 — Basic base64(시크릿 키:), 같은 결제는 Idempotency-Key 로 같은 응답
 *
 * @param confirm 성공 주소 query
 * @param secretKey 결제위젯 시크릿 키
 */
export async function confirmTossPayment(confirm: ConfirmRequestType, secretKey: string): Promise<ConfirmResultType> {
    const response = await fetch(TOSS_CONFIRM_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(`${secretKey}:`)}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': confirm.paymentKey,
        },
        body: JSON.stringify({paymentKey: confirm.paymentKey, orderId: confirm.orderId, amount: confirm.amount}),
    }).catch((error: unknown) => {
        console.log('[toss] 승인 요청 실패 —', error instanceof Error ? error.message : error);
        return null;
    });

    if (!response) {
        return toConfirmResult(null, null);
    }

    const body: unknown = await response.json().catch((): null => null);
    const result = toConfirmResult(response.status, body);
    if (result.state !== 'ok') {
        console.log(`[toss] 승인 실패 ${response.status} —`, body);
    }

    return result;
}
```

```ts
// src/app/api/payments/confirm/route.ts
import { cookies } from 'next/headers';
import { isSameSiteJson, json } from '../../route-util';
import { refreshCookieName } from '../../cookie/token-cookie';
import { CONFIRM_CONFIG_MESSAGE, CONFIRM_INVALID_MESSAGE, CONFIRM_LOGIN_MESSAGE, confirmTossPayment, ConfirmRequestType, isConfirmRequest } from './toss-confirm';

/**
 * 토스 결제 승인 중계 — 성공 주소 query(paymentKey · orderId · amount)로 시크릿 키 승인
 * - 같은 사이트 JSON · 이용자 로그인(refresh 쿠키) · 값 검사 · 시크릿 키가 있을 때만 토스를 부른다
 * - 금액 대조 · 예약 확정은 그 뒤 화면이 부르는 백엔드 payment-confirm 이 한다
 *
 * @param request 본문 {paymentKey, orderId, amount}
 */
export async function POST(request: Request): Promise<Response> {
    if (!isSameSiteJson(request)) {
        return json({success: false, message: CONFIRM_INVALID_MESSAGE});
    }

    const cookieStore = await cookies();
    if (!cookieStore.get(refreshCookieName('user'))?.value) {
        return json({success: false, message: CONFIRM_LOGIN_MESSAGE});
    }

    const body = (await request.json().catch((): null => null)) as Partial<ConfirmRequestType> | null;
    if (!isConfirmRequest(body)) {
        return json({success: false, message: CONFIRM_INVALID_MESSAGE});
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
        console.error('[toss] TOSS_SECRET_KEY 가 없습니다.');
        return json({success: false, message: CONFIRM_CONFIG_MESSAGE});
    }

    const result = await confirmTossPayment(body, secretKey);
    if (result.state === 'ok') {
        return json({success: true});
    }

    return result.state === 'retry'
        ? json({success: false, message: result.message, retry: true})
        : json({success: false, message: result.message, code: result.code});
}
```

```ts
// src/shared/api/payment.ts
import { NetworkError, sendRequest } from '@/shared/api/request';

/** 결제 성공 주소 query — 토스가 붙여 준 값 그대로 */
export type TossConfirmQueryType = {
    paymentKey: string;
    orderId: string;
    amount: number;
};

/** 승인 route 결과 */
export type TossConfirmResultType = {
    success: boolean;
    message?: string; // 실패 문구 — 그대로 보여 준다
    code?: string;    // 토스 오류 코드
    retry?: boolean;  // 잠시 뒤 다시 승인
};

/**
 * 토스 결제 승인(route handler) — 결과 화면(U4)이 부르고, success 면 백엔드 payment-confirm 으로
 * - route 에 닿지 못하거나 본문을 못 읽으면 NetworkError
 *
 * @param query 성공 주소 query
 */
export async function requestTossConfirm(query: TossConfirmQueryType): Promise<TossConfirmResultType> {
    const response = await sendRequest('/api/payments/confirm/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(query),
    });
    if (!response.ok) {
        throw new NetworkError(new Error(`payment confirm route ${response.status}`));
    }

    const result = (await response.json().catch((): null => null)) as TossConfirmResultType | null;
    if (!result) {
        throw new NetworkError(new Error('payment confirm route body'));
    }

    return result;
}
```

### 설정

```bash
# .env.example — "이미지 · 외부 연동" 아래에 더한다
# [빌드] 토스 결제위젯 연동 클라이언트 키 (토스 개발자센터 "결제위젯 연동 키" — test_gck_… / live_gck_…)
NEXT_PUBLIC_TOSS_CLIENT_KEY=
# [실행] 토스 결제위젯 연동 시크릿 키 (test_gsk_… / live_gsk_…) — 결제 승인 route handler 에서만. NEXT_PUBLIC_ 을 붙이지 않는다
TOSS_SECRET_KEY=
```

```json
// .beaver/config.json — stack
"stack": ["nextjs@16", "react@19", "typescript", "fetch", "class-validator", "next-auth@4", "vitest", "testing-library-react", "css-modules", "tosspayments-sdk@2", "dnd-kit"]
```

### 개발 전용 미리보기 `/dev/infra/`

근거: `/dev/ui` 와 같은 방식(`src/app/dev/ui/page.tsx:5-13` — 운영 404, 화면은 `<화면>Content`). 실제 API 없이 부품만 본다.

```tsx
// src/app/dev/infra/page.tsx
import { notFound } from 'next/navigation';
import InfraPreviewContent from './InfraPreviewContent';

// 개발 전용 — 공통 인프라 부품 미리보기(지도 · 주소 · 인증번호 · 사진 · 결제위젯) (운영 404)
export default function InfraPreview(): React.ReactNode {
    if (process.env.NODE_ENV === 'production') {
        notFound();
    }

    return (
        // 미리보기 화면
        <InfraPreviewContent />
    );
}
```

```tsx
// src/app/dev/infra/InfraPreviewContent.tsx
'use client';
import { useState } from 'react';
import { handleApiError } from '@/shared/api/error';
import { IMAGE_TYPE_MESSAGE } from '@/shared/api/upload';
import StoreMap from '@/shared/components/map/StoreMap';
import TossPaymentWidget, { TossPaymentType } from '@/shared/components/payment/TossPaymentWidget';
import SmsVerification, { SmsSentType } from '@/shared/components/sms/SmsVerification';
import Button from '@/shared/components/ui/button/Button';
import ImageUploader, { UploaderImageType } from '@/shared/components/upload/ImageUploader';
import useMyLocation from '@/shared/hooks/useMyLocation';
import { MapMarkerType, MapPointType } from '@/shared/types/map';
import { AddressWithCoordsType, searchAddressWithCoords } from '@/shared/utils/address';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { imageContentType } from '@/shared/utils/file';
import styles from '@/app/css/dev/InfraPreviewContent.module.css';

/** 미리보기 인증번호 — 이 값이면 인증 완료 */
const DEMO_CODE = '123456';

/** 미리보기 결제 마감 */
const DEMO_PAYMENT_MS = 5 * 60 * 1000;

/**
 * 공통 인프라 미리보기 — 실제 API 없이 부품 동작만
 *
 * @returns
 */
export default function InfraPreviewContent(): React.ReactNode {
    // 변수
    const myLocation = useMyLocation(); // 내 위치 — 지도 처음 중심

    // 상태
    const [idleCenter, setIdleCenter] = useState<MapPointType | null>(null);        // 지도가 멈춘 중심
    const [clickedStore, setClickedStore] = useState<string>('');                    // 누른 마커
    const [address, setAddress] = useState<AddressWithCoordsType | null>(null);      // 주소 검색 결과
    const [smsResult, setSmsResult] = useState<string>('');                          // 인증 결과 문구
    const [images, setImages] = useState<Array<UploaderImageType>>([]);              // 올린 사진(브라우저 안에서만)
    const [payment, setPayment] = useState<TossPaymentType | null>(null);            // 미리보기 결제 정보

    // 계산 값
    const center = myLocation.location;                         // 지도 중심
    const markers = center ? sampleMarkers(center) : [];        // 내 위치 둘레 예시 업체

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
        return {sms_verification_id: 'preview', expires_at: new Date(Date.now() + DEMO_PAYMENT_MS).toISOString()};
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
        // 미리보기 삭제
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
            expires_at: new Date(Date.now() + DEMO_PAYMENT_MS).toISOString(),
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
                <p className={styles.result}>{myLocation.loading ? '위치 확인 중…' : myLocation.isDefault ? '기본 위치(서울시청)' : '내 위치'} · 멈춘 중심 {idleCenter ? `${idleCenter.latitude.toFixed(5)}, ${idleCenter.longitude.toFixed(5)}` : '-'} · 누른 마커 {clickedStore || '-'}</p>
                {center ? <div className={styles.map}><StoreMap center={center} markers={markers} onIdle={setIdleCenter} onMarkerClick={setClickedStore} /></div> : null}
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
                <div className={styles.narrow}><SmsVerification onSend={demoSend} onConfirm={demoConfirm} /></div>
                <p className={styles.result}>{smsResult || '-'}</p>
            </section>

            {/* 사진 */}
            <section className={styles.section} data-area="console">
                <h2 className={styles.sectionTitle}>사진 올리기 · 순서 · 삭제</h2>
                <ImageUploader images={images} max={5} onUpload={demoUpload} onDelete={demoDelete} onReorder={demoReorder} />
            </section>

            {/* 결제위젯 */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>토스 결제위젯</h2>
                {payment ? (
                    <div className={styles.narrow}><TossPaymentWidget payment={payment} onExpired={() => setPayment(null)} /></div>
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
```

```css
/* src/app/css/dev/InfraPreviewContent.module.css */
.page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 960px;
    margin: 0 auto;
    padding: 32px 16px 96px;
}

.head {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
}

.desc,
.result {
    margin: 0;
    color: var(--muted);
}

.section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    border: 1px dashed var(--faint);
    border-radius: var(--radius-lg);
    background: var(--surface);
}

.sectionTitle {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
}

.map {
    --store-map-h: 360px;
}

.narrow {
    max-width: 420px;
}
```

### 지우는 것
- `src/shared/components/KakaoMap.tsx` — 호출처 0(grep). 로더는 `src/shared/utils/kakao-map.ts`, 지도는 `StoreMap`, `window.kakao` 전역 선언은 `kakao-map.ts` 로.
- `src/shared/utils/address.ts` 의 `searchAddress` — 호출처 0. `searchAddressWithCoords` 로.
- `src/app/api/cookie/token-cookie.ts` 의 `json` · `isSameSiteJson` — `src/app/api/route-util.ts` 로 옮김(내용 그대로).

### 문서
`KakaoMap.tsx` 를 근거로 든 곳을 새 파일로 바꾼다(줄 번호는 build 때 스크립트로 대조):
- AGENTS.md Conventions(props 예 `KakaoMap.tsx:11` → `StoreMap.tsx` `StoreMapProps`) · Key Patterns(외부 스크립트 `KakaoMap.tsx:27` → `src/shared/utils/kakao-map.ts`).
- docs/conventions.md 이름 표(`KakaoMap` / `KakaoMapProps` → `StoreMap` / `StoreMapProps`, `KAKAO_MAP_SCRIPT_ID` → `kakao-map.ts`), props 기본값 예, `any` 예외(`KakaoMap.tsx:6` → `kakao-map.ts`).
- docs/architecture.md 외부 스크립트(`KakaoMap.tsx:26-45` → `kakao-map.ts`).
- AGENTS.md Conventions 의 공통 부품 줄에 새 부품(`map/StoreMap` · `sms/SmsVerification` · `upload/ImageUploader` · `payment/TossPaymentWidget`)과 미리보기 `/dev/infra`.

새 규약 영역(결제 · 파일 올리기 · 지도) — 사용자 결정 "새 문서로": `docs/integrations.md`(초안 — `<!-- beaver:draft … -->`) + AGENTS.md "## 외부 연동" 절 · Checklist 한 줄(초안 표시). build 가 코드와 맞추고 ship 이 확정한다.

---

## Test Cases
```
[ABOUT:imageContentType] 고른 파일이 올릴 수 있는 사진(JPG · PNG)인지 보고 그 MIME 을 돌려준다 // MIME 이 있으면 MIME 이 image/jpeg · image/png 일 때만, MIME 이 비어 있으면 확장자 .jpg · .jpeg · .png(대소문자 무시)일 때만 통과
[CASES:imageContentType] `{type: 'image/jpeg', name: 'a.jpg'}` → `'image/jpeg'` // MIME 이 허용 목록에 있음
[CASES:imageContentType] `{type: 'image/png', name: 'a.png'}` → `'image/png'` // MIME 이 허용 목록에 있음
[CASES:imageContentType] `{type: '', name: 'photo.JPG'}` → `'image/jpeg'` // MIME 이 비어 확장자로 판단 — 대소문자를 무시하면 jpg
[CASES:imageContentType] `{type: '', name: 'photo.jpeg'}` → `'image/jpeg'` // MIME 이 비어 확장자로 판단 — jpeg 도 JPG
[CASES:imageContentType] `{type: '', name: 'scan.png'}` → `'image/png'` // MIME 이 비어 확장자로 판단 — png
[CASES:imageContentType] `{type: 'image/gif', name: 'a.gif'}` → `null` // GIF 는 허용 목록에 없음(백엔드 DTO 도 JPG · PNG 만)
[CASES:imageContentType] `{type: 'image/heic', name: 'IMG_1.HEIC'}` → `null` // HEIC(아이폰 기본 사진)는 허용 목록에 없음
[CASES:imageContentType] `{type: 'image/gif', name: 'fake.jpg'}` → `null` // MIME 이 있으면 MIME 이 먼저 — 확장자만 바꾼 파일을 막음
[CASES:imageContentType] `{type: '', name: 'noext'}` → `null` // MIME 도 확장자도 없어 판단할 근거가 없음
[ABOUT:toConfirmResult] 토스 결제 승인 응답(상태 코드 · 본문)을 화면에 줄 결과(성공 · 실패 · 잠시 뒤 다시)로 바꾼다 // 2xx · ALREADY_PROCESSED_PAYMENT 는 성공, IDEMPOTENT_REQUEST_PROCESSING · 5xx · 응답 없음은 잠시 뒤 다시, 그 밖 4xx 는 실패(401 · 403 · 본문 없음은 일반 문구)
[CASES:toConfirmResult] `(200, {paymentKey: 'pk', status: 'DONE'})` → `{state: 'ok'}` // 2xx 는 승인 완료
[CASES:toConfirmResult] `(400, {code: 'ALREADY_PROCESSED_PAYMENT', message: '이미 처리된 결제 입니다.'})` → `{state: 'ok'}` // 이미 승인된 결제 — 새로고침 · 다시 승인이라 성공으로 본다
[CASES:toConfirmResult] `(400, {code: 'REJECT_CARD_COMPANY', message: '카드사에서 거절했습니다.'})` → `{state: 'fail', code: 'REJECT_CARD_COMPANY', message: '카드사에서 거절했습니다.'}` // 그 밖 4xx 는 다시 결제해야 하는 실패 — 토스 문구가 이용자에게 맞는 안내
[CASES:toConfirmResult] `(404, {code: 'NOT_FOUND_PAYMENT_SESSION', message: '결제 시간이 만료되어 결제 진행 데이터가 존재하지 않습니다.'})` → `{state: 'fail', code: 'NOT_FOUND_PAYMENT_SESSION', message: '결제 시간이 만료되어 결제 진행 데이터가 존재하지 않습니다.'}` // 4xx 실패 — 결제 세션 만료도 토스 문구 그대로
[CASES:toConfirmResult] `(401, {code: 'UNAUTHORIZED_KEY', message: '인증되지 않은 시크릿 키 혹은 클라이언트 키 입니다.'})` → `{state: 'fail', code: 'UNAUTHORIZED_KEY', message: '결제를 승인하지 못했습니다.'}` // 401 · 403 은 우리 키 문제 — 키 이야기를 이용자에게 보이지 않고 일반 문구
[CASES:toConfirmResult] `(400, null)`(본문이 JSON 아님) → `{state: 'fail', message: '결제를 승인하지 못했습니다.'}` // 4xx 인데 본문을 못 읽어 보일 토스 문구가 없음
[CASES:toConfirmResult] `(409, {code: 'IDEMPOTENT_REQUEST_PROCESSING', message: '이전 요청이 처리 중입니다.'})` → `{state: 'retry', message: '결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요.'}` // 같은 결제 승인이 아직 처리 중(두 탭 · 연달아 새로고침) — 끝난 뒤 다시 승인하면 같은 응답
[CASES:toConfirmResult] `(500, {code: 'FAILED_INTERNAL_SYSTEM_PROCESSING', message: '내부 시스템 처리 작업이 실패했습니다.'})` → `{state: 'retry', message: '결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요.'}` // 5xx 는 토스 쪽 일시 장애 — 같은 결제를 다시 승인하면 된다
[CASES:toConfirmResult] `(null, null)`(응답 없음) → `{state: 'retry', message: '결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요.'}` // 응답이 없어 승인됐는지 모름 — 다시 승인해도 멱등 키로 같은 응답
[ABOUT:uploadFile] 사진 한 장을 형식 확인 → 업로드 주소 발급 → S3 PUT → 등록 순서로 올린다 // 앞 단계가 실패하면 다음 단계를 부르지 않고 ApiError 를 던진다
[SUCCESS] uploadFile — `issue('image/png')` 1회 → PUT(`upload_url`, 파일, `Content-Type: image/png`) 1회 → `register({file_key, file_name, content_type})` 1회 순서 → 결과 = `register` 결과 // 세 단계가 모두 성공한 정상 흐름 — PUT 헤더는 발급 때 보낸 형식과 같아야 S3 가 받는다
[FAIL:validation] uploadFile — GIF 파일 → `ApiError(400, 'JPG · PNG 사진만 올릴 수 있습니다.')`, `issue` · PUT · `register` 0회 // JPG · PNG 가 아니면 업로드 주소를 받기 전에 막음
[FAIL:upload] uploadFile — PUT 이 403 → `ApiError(403, '사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.')`, `register` 0회 // S3 가 거절하면 올라간 파일이 없으니 등록하지 않음
[FAIL:upload] uploadFile — 업로드 주소가 `null` → `ApiError(500, '사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.')`, PUT · `register` 0회 // 올릴 주소가 없음
[FAIL:network] uploadFile — PUT 응답 없음(fetch 실패) → `NetworkError`, `register` 0회 // 올라갔는지 모르니 등록하지 않고 네트워크 안내
[ABOUT:POST /api/payments/confirm/] 결제 성공 주소의 값(paymentKey · orderId · amount)으로 시크릿 키 토스 승인을 대신 부른다 // 같은 사이트 JSON · 이용자 로그인(refresh 쿠키) · 값 검사 · 시크릿 키가 모두 맞을 때만 토스를 부른다
[SUCCESS] POST /api/payments/confirm/ — 토스 1회: 주소 · `Authorization: Basic base64(<키>:)` · `Idempotency-Key: <paymentKey>` · 본문 `{paymentKey, orderId, amount}` → `{success: true}` // 조건이 모두 맞는 정상 흐름 — 같은 결제는 Idempotency-Key 로 같은 응답
[FAIL:validation] POST /api/payments/confirm/ — `orderId` 가 32자 hex 가 아님 · `amount` 0 · `paymentKey` 에 줄바꿈 등 다른 글자 → `{success: false, message: '결제 정보가 올바르지 않습니다.'}`, 토스 0회 // 우리 payment_id(32자 hex) · 양의 금액 · 헤더에 실을 수 있는 결제 키(영문 · 숫자 · _ · -)가 아니면 토스에 보낼 값이 아님
[FAIL:login] POST /api/payments/confirm/ — 이용자 refresh 쿠키 없음 → `{success: false, message: '로그인이 필요합니다.'}`, 토스 0회 · 시크릿 키 없음 → `'결제 설정이 없습니다.'`, 토스 0회 // 로그인하지 않은 요청 · 키가 없는 서버는 승인을 부르지 않음
[FAIL:csrf] POST /api/payments/confirm/ — `Content-Type: text/plain` · JSON 이지만 `Sec-Fetch-Site: cross-site` → `{success: false, message: '결제 정보가 올바르지 않습니다.'}`, 토스 0회 // 다른 사이트가 승인을 부르는 것 막기 — 같은 사이트 JSON 만
[ABOUT:SmsVerification] 번호 → 인증번호 받기 → 6자리 + 남은 시간 → 확인 흐름을 그리고, 발송 · 확인은 화면 함수에 넘긴다 // 받은 인증이 있고 남은 시간이 남았을 때만 확인을 부른다
[SUCCESS] SmsVerification — 번호 입력 · "인증번호 받기" → `onSend('01012345678')` 1회 → 인증번호 칸 · 남은 시간이 보임 → 6자리 · "인증하기" → `onConfirm(<받은 id>, '123456')` 1회 // 받은 인증이 있고 시간이 남아 확인 조건을 만족 — 번호 · 코드는 숫자만 넘김
[SUCCESS] SmsVerification — 받은 뒤 번호를 고침 → 인증번호 칸이 사라지고 "인증번호 받기" // 받은 인증은 그 번호의 것 — 새 번호는 다시 받아야 함
[SUCCESS] SmsVerification — 만료 뒤 "다시 받기" → 새 인증 · 인증번호 칸 비움 · 만료 풀림 → 새 id 로 확인 // 새 인증이라 남은 시간도 새로 — 확인은 마지막으로 받은 인증으로
[FAIL:busy] SmsVerification — 보내는 중 → 번호 칸 · 받기 버튼 막힘, 끝나면 풀림 // 보내는 중에 번호가 바뀌면 다른 번호의 인증을 확인하게 됨
[FAIL:not-sent] SmsVerification — `onSend` 가 `null` → 인증번호 칸이 보이지 않음 · `onConfirm` 0회 // 화면이 못 보냈다고 알림 — 받은 인증이 없음
[FAIL:expired] SmsVerification — 남은 시간이 지남 → "인증하기" 막힘 · 만료 문구 · `onConfirm` 0회 // 남은 시간이 0 — 만료된 인증번호는 서버도 거절
[ABOUT:useMyLocation] 위치 권한을 물어 내 위치를 주고, 못 읽으면 기본 위치(서울시청)를 준다 // 10초 안에 브라우저가 좌표를 주면 그 좌표, 거부 · 지원 안 함 · 10초 동안 답 없음이면 기본 위치
[SUCCESS] useMyLocation — 위치를 받음 → 그 좌표 · `isDefault: false` // 브라우저가 좌표를 줌
[FAIL:denied] useMyLocation — 거부 · `navigator.geolocation` 없음 → 서울시청(37.5665, 126.9780) · `isDefault: true` // 좌표를 못 받음 — 지도는 기본 위치에서 시작
[FAIL:timeout] useMyLocation — 권한 창에 답이 없어 콜백이 오지 않음 · 10초 → 서울시청 · `isDefault: true` // 브라우저 제한 시간은 권한 창이 떠 있는 시간을 세지 않음 — 자체 10초로 끊음
[ABOUT:ImageUploader] 사진 목록(첫 장 대표 · 순번 · 삭제 · 순서 끌기)과 올리기 칸을 그리고, 고른 파일 · 삭제 · 순서는 화면 함수에 넘긴다 // 장수가 max 보다 적을 때만 올리기 칸, onReorder 를 줬을 때만 손잡이
[SUCCESS] ImageUploader — 사진 2장 · 파일 고르기 · 삭제 → 첫 장 "대표", `onUpload(file)` 1회 · `onDelete(id)` 1회 // 첫 장이 대표(백엔드도 첫 사진이 대표) — 고른 파일 · 누른 삭제를 그대로 넘김
[SUCCESS] ImageUploader — `onReorder` 없음 → 손잡이 없음 // 순서 API 가 없는 화면(입점 신청)은 끌기를 보이지 않음
[FAIL:max] ImageUploader — 장수가 `max` → "사진 올리기" 칸 없음 // 최대 장수(5장)를 넘으면 서버가 400 — 올리기를 미리 숨김

테스트 생략(위임형): StoreMap · loadKakaoMap · searchAddressWithCoords(카카오 · 다음 SDK 를 부르기만 — jsdom 에 SDK 없음, 좌표 변환은 사용자 결정으로 TDD 생략) · TossPaymentWidget(토스 SDK 를 그리기만) · requestTossConfirm(route 를 부르기만 — cookie.ts 의 refreshAreaToken 과 같은 모양) · ImageUploader 의 끌기(@dnd-kit 이 보장) · route-util 옮김(기존 token-cookie 테스트가 그대로 확인) · /dev/infra · .env.example · 문서
```

테스트 파일 · 방식(docs/testing.md):
- `src/test/shared/utils/file.test.ts` · `src/test/app/api/payments/confirm/toss-confirm.test.ts` · `src/test/shared/api/upload.test.ts` · `src/test/shared/hooks/useMyLocation.test.ts` 는 `// @vitest-environment node`(마지막은 jsdom — `renderHook`).
- route 테스트는 `next/headers` 의 `cookies` 를 `vi.hoisted` mock(`src/test/app/api/cookie/token-cookie.test.ts:12-17` 와 같은 방식), 토스는 `vi.stubGlobal('fetch')`, 키는 `vi.stubEnv('TOSS_SECRET_KEY', 'test_gsk_key')`.
- `SmsVerification` 은 `vi.useFakeTimers({now})` + `act(() => vi.advanceTimersByTime(…))` 로 `Timer`(0.3초 간격 · `dayjs()`)를 넘긴다. 클릭 · 입력은 `fireEvent`(user-event 없음).
- `useMyLocation` 은 `Object.defineProperty(navigator, 'geolocation', {value, configurable: true})` 로 성공 · 거부 · 없음.
- `ImageUploader` 는 `fireEvent.change(input, {target: {files: [file]}})`. `next/image` 는 jsdom 에서 `<img>` 로 그려진다(`unoptimized`).

---

## Response Codes

| 진입점 | 결과 | 원인 |
|------|------|------|
| `POST /api/payments/confirm/` | 200 `{success: true}` | 토스 승인 200 · `ALREADY_PROCESSED_PAYMENT` |
| | 200 `{success: false, message: '결제 정보가 올바르지 않습니다.'}` | 같은 사이트 JSON 아님 · 본문 검사 실패 |
| | 200 `{success: false, message: '로그인이 필요합니다.'}` | `user_refresh_token` 쿠키 없음 |
| | 200 `{success: false, message: '결제 설정이 없습니다.'}` | `TOSS_SECRET_KEY` 없음 |
| | 200 `{success: false, message: <토스 문구>, code}` | 토스 4xx(카드 거절 · 결제 세션 만료 …) |
| | 200 `{success: false, message: '결제를 승인하지 못했습니다.', code?}` | 토스 401 · 403(키) · 4xx 본문 없음 |
| | 200 `{success: false, message: '결제 승인이 잠시 안 됩니다. 잠시 뒤 다시 시도해 주세요.', retry: true}` | 토스 5xx · 응답 없음 |
| `requestTossConfirm` | route 본문 그대로 | — |
| | `NetworkError` | route 에 닿지 못함 · 2xx 아님 · 본문 없음 |
| `uploadFile` | 등록 결과 / `null` | 등록 done / 큐 pending |
| | `ApiError(400, 'JPG · PNG 사진만 올릴 수 있습니다.')` | 형식 아님(발급 · PUT · 등록 안 부름) |
| | `ApiError(500 · S3 상태, '사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.')` | 업로드 주소 없음 · PUT 2xx 아님(등록 안 부름) |
| | `ApiError` · `NetworkError` · `LoginRequiredError` | 발급 · 등록 API 실패(화면이 넘긴 함수가 던진 것 그대로) |
| `searchAddressWithCoords` | `{zonecode, address, latitude, longitude}` | 고르고 좌표를 찾음 |
| | `null` | 고르지 않고 닫음 / 좌표 못 찾음(오류 팝업) |
| | `Error` | 우편번호 · 카카오 스크립트를 못 불러옴 |
| `useMyLocation` | `{location, isDefault: false}` | 위치 읽음 |
| | `{location: 서울시청, isDefault: true}` | 거부 · 지원 안 함 · 시간 초과 · 오류 |
| `SmsVerification` · `ImageUploader` · `TossPaymentWidget` · `StoreMap` | 콜백 | 위 Business Rules 그대로 — 실패 안내는 화면 함수 · 오류 팝업 |
