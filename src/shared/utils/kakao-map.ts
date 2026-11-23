import { getPublicEnv } from './public-env';

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
 * - 못 불러오면 태그를 지운다 — 다음 호출이 다시 붙인다(오지 않을 load 를 기다리지 않게)
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
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${getPublicEnv('NEXT_PUBLIC_DAUM_MAP_API_KEY') ?? ''}&autoload=false&libraries=services`;
            script.async = true;
            document.head.appendChild(script);
        }

        const loading = script;
        loading.addEventListener('load', () => window.kakao.maps.load(() => resolve()), { once: true });
        loading.addEventListener('error', () => {
            loading.remove();
            reject(new Error('카카오 지도 스크립트를 불러오지 못했습니다.'));
        }, { once: true });
    });
}
