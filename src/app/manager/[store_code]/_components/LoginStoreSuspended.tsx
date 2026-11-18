import Band from '@/shared/components/ui/display/Band';

type LoginStoreSuspendedProps = {
    message: string;               // "영업이 중지된 업체입니다."
    suspendComment: string | null; // 정지 사유
};

/**
 * 영업중지 띠 — 로그인은 그대로 두고 알리기만(로그인해서 내 업체 · 대시보드에서 정지 사유를 본다)
 *
 * @param param0
 * @returns
 */
export default function LoginStoreSuspended({message, suspendComment}: LoginStoreSuspendedProps): React.ReactNode {
    return (
        // 영업중지
        <Band tone="danger" title={message}>{suspendComment ? `정지 사유: ${suspendComment}` : null}</Band>
    );
}
