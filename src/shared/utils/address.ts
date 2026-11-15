import { showErrorPopup } from '@/shared/utils/error-popup';
import { loadKakaoMap } from '@/shared/utils/kakao-map';

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 다음 우편번호 SDK 전역(타입 패키지 없음)
        daum: any;
    }
}

type PostcodeResult = {
    address: string;
    zonecode: string;
}

/** 주소 검색 결과 — 입점 신청(U11) · 업체 정보 수정(A4)의 주소 · 좌표 칸 */
export type AddressWithCoordsType = {
    zonecode: string;  // 우편번호
    address: string;   // 고른 주소(도로명 또는 지번)
    latitude: number;  // 위도 (WGS84)
    longitude: number; // 경도 (WGS84)
};

const POSTCODE_SCRIPT_ID = 'daum-postcode';
const POSTCODE_SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

/** 고른 주소의 좌표를 못 찾았을 때 */
export const ADDRESS_COORDS_NOT_FOUND_MESSAGE = '주소의 위치를 찾지 못했습니다. 다른 주소로 검색해 주세요.';

/**
 * 다음 우편번호 스크립트 로드 — 한 번만 붙이고, 이미 붙어 있으면 로드가 끝나기를 기다린다
 * - 주소 검색 버튼이 있는 화면은 처음 그릴 때 preloadAddressSearch() 로 미리 불러 둔다(첫 클릭에 팝업이 막히지 않게)
 * - 못 불러오면 태그를 지운다 — 다음 호출이 다시 붙인다
 */
export function loadAddressSearchScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.daum?.Postcode) {
            resolve();
            return;
        }

        let script = document.getElementById(POSTCODE_SCRIPT_ID) as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.id = POSTCODE_SCRIPT_ID;
            script.src = POSTCODE_SCRIPT_SRC;
            script.async = true;
            document.body.appendChild(script);
        }

        const loading = script;
        loading.addEventListener('load', () => resolve(), { once: true });
        loading.addEventListener('error', () => {
            loading.remove();
            reject(new Error('우편번호 스크립트를 불러오지 못했습니다.'));
        }, { once: true });
    });
}

/**
 * 주소 검색 스크립트(우편번호 · 카카오 지오코더) 미리 불러 두기 — 주소 검색 버튼이 있는 화면이 처음 그릴 때(효과에서)
 * - 실패는 조용히 — 버튼을 누를 때 다시 불러 오류를 알린다
 */
export function preloadAddressSearch(): void {
    loadAddressSearchScript().catch((): null => null);
    loadKakaoMap().catch((): null => null);
}

/**
 * 주소 검색 → 좌표 — 다음 우편번호 팝업에서 고른 주소를 카카오 지오코더로 위도 · 경도까지
 * - 팝업을 먼저 열고(클릭 직후라야 브라우저가 막지 않는다) 카카오 SDK 는 좌표를 구할 때 기다린다
 * - 고르지 않고 닫으면 null, 좌표를 못 찾으면 오류 팝업 후 null
 * - 스크립트를 못 불러오면 Error 를 던진다 — 화면은 catch 에서 handleApiError
 *
 * @returns 주소 · 좌표, 없으면 null
 */
export async function searchAddressWithCoords(): Promise<AddressWithCoordsType | null> {
    const kakaoReady = loadKakaoMap();
    kakaoReady.catch((): null => null); // 팝업이 열려 있는 동안 실패해도 처리 안 된 거절로 남지 않게 — 아래 await 에서 던진다

    await loadAddressSearchScript();
    const picked = await pickAddress();
    if (!picked) {
        return null;
    }

    await kakaoReady;
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
