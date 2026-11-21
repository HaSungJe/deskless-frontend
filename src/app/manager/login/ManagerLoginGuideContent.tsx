'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import ConsoleAuthCard from '@/shared/components/console/ConsoleAuthCard';
import ConsoleAuthFrame from '@/shared/components/console/ConsoleAuthFrame';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { validateAction } from '@/shared/utils/validation';
import { managerLoginPath } from '../manager-auth';
import { StoreCodeDto } from './dto';
import styles from '@/app/css/manager/ManagerLoginGuideContent.module.css';

type ManagerLoginGuideContentProps = {
    returnUrl: string | null; // 로그인 뒤 돌아갈 주소 — 업체 로그인으로 넘긴다
};

/** 로그인 주소 모양 앞부분 — 이 배포의 프론트 주소(빌드 때 박힌다) */
const LOGIN_URL_PREFIX = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${process.env.NEXT_PUBLIC_LOCAL_SERVER_PREFIX ?? ''}/manager/`;

/**
 * M1 업체 로그인 주소 안내 — 업체코드를 붙여 넣으면 그 업체 로그인 화면으로(API 없음)
 *
 * @param param0
 * @returns
 */
export default function ManagerLoginGuideContent({returnUrl}: ManagerLoginGuideContentProps): React.ReactNode {
    // 변수
    const router = useRouter(); // 업체 로그인으로 이동

    // 상태
    const [storeCode, setStoreCode] = useState<string>(''); // 붙여 넣은 업체코드

    // 함수
    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        // ③ 앞뒤 공백을 지우고 32자 모양 검사(칸 아래 오류) → 그 업체 로그인
        event.preventDefault();
        const dto = Object.assign(new StoreCodeDto(), {store_code: storeCode.trim()});
        if (!(await validateAction(dto))) {
            return;
        }

        const next = managerLoginPath(dto.store_code, returnUrl);
        if (next) {
            router.push(next);
        }
    }

    return (
        // 업체 로그인 주소 안내 — 메뉴 없는 가운데 카드
        <ConsoleAuthFrame areaName="업체 관리자 콘솔">
            <ConsoleAuthCard wide title="업체 로그인 주소로 접속해 주세요" description="업체 관리자 콘솔은 업체마다 로그인 주소가 따로 있습니다. 업체 총관리자에게 받은 로그인 주소로 접속하고, 즐겨찾기해 두면 다음부터 바로 들어올 수 있습니다.">
                {/* ② 로그인 주소 모양 */}
                <p className={styles.sample}>로그인 주소 모양 · {LOGIN_URL_PREFIX}<b>업체코드 32자</b>/login</p>

                {/* ③ 업체코드 */}
                <form className={styles.form} onSubmit={submit} noValidate>
                    <Field label="업체코드" name="store_code" htmlFor="manager-guide-code" hint="영문 소문자 · 숫자 32자 — 업체 관리자 등록 문자, 또는 업체 총관리자가 내 업체 설정 › 기본 정보에서 복사한 로그인 주소 안에 있습니다.">
                        <Input id="manager-guide-code" autoComplete="off" spellCheck={false} placeholder="로그인 주소 안의 32자를 붙여 넣으세요" value={storeCode} onChange={(event) => setStoreCode(event.target.value)} />
                    </Field>
                    <Button type="submit" variant="primary" full>로그인 화면으로 이동</Button>
                </form>
            </ConsoleAuthCard>
        </ConsoleAuthFrame>
    );
}
