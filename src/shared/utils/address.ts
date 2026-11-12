declare global {
    interface Window {
        daum: any;
    }
}

type PostcodeResult = {
    address: string;
    zonecode: string;
}

const POSTCODE_SCRIPT_ID = 'daum-postcode';
const POSTCODE_SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

/**
 * 다음 우편번호 스크립트 로드 — 한 번만 붙이고, 이미 붙어 있으면 로드가 끝나기를 기다린다
 * - 주소 검색 버튼이 있는 화면은 처음 그릴 때 미리 불러 두면 첫 클릭이 빠르다
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

        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener('error', () => reject(new Error('우편번호 스크립트를 불러오지 못했습니다.')), { once: true });
    });
}

/**
 * 다음 우편번호 검색 팝업을 열고, 고르면 우편번호 · 주소를 넘겨준다
 *
 * @param zip 우편번호(zonecode) 받을 함수
 * @param addr1 주소(address) 받을 함수
 */
export async function searchAddress(zip?: (zonecode: string) => void, addr1?: (address: string) => void): Promise<void> {
    await loadAddressSearchScript();
    new window.daum.Postcode({
        oncomplete: function (data: PostcodeResult) {
            zip?.(data.zonecode);
            addr1?.(data.address);
        },
    }).open();
}
