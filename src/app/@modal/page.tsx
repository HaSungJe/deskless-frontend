// 홈(/)에서는 팝업 슬롯을 비운다 — [...catchAll] 은 / 에 맞지 않는다(팝업 안 링크로 홈에 가도 팝업이 남지 않게 — docs/architecture.md "경로 모달")
export default function ModalSlotHome(): null {
    return null;
}
