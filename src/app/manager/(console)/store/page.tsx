import StoreSettingsContent from './StoreSettingsContent';

// M7 내 업체 설정 — /manager/store (콘솔 틀 · 매니저 로그인 필요 — layout 이 감싼다)
export default function StoreSettings(): React.ReactNode {
    return (
        // 내 업체 설정
        <StoreSettingsContent />
    );
}
