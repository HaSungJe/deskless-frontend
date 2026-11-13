/**
 * 경로 모달 예시 내용 — 팝업 · 보통 페이지 둘 다 이것을 그린다
 *
 * @returns
 */
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
