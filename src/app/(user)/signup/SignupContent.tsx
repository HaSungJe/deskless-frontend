'use client';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useState } from 'react';
import { lookupName } from '@/contracts/common/lookup';
import { signWithSns } from '@/contracts/user/api';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { loginUrl } from '@/shared/utils/area';
import { showErrorPopup } from '@/shared/utils/error-popup';
import { validateAction } from '@/shared/utils/validation';
import UserTopBar from '../_components/UserTopBar';
import { afterLoginPath, SNS_EXPIRED_MESSAGE } from '../login/login-flow';
import { formatBirthInput } from './birth';
import { SignupDto } from './dto';
import styles from '@/app/css/user/SignupContent.module.css';

type SignupContentProps = {
    sns: string | null;       // 가입할 SNS(KAKAO · NAVER) — 보이기만(서버 세션을 믿는다)
    returnUrl: string | null; // 가입 · 휴대폰 인증 뒤 돌아갈 주소
};

/** 성별 — 아직 안 고름 · 남 · 여 */
type GenderType = '' | 'M' | 'F';

/** 성별 카드 — 시안 user.html:893-899 */
const GENDER_OPTIONS: Array<{value: GenderType; label: string}> = [{value: 'M', label: '남'}, {value: 'F', label: '여'}];

/** 닉네임 최대 글자 수 — UserSignDto */
const NICKNAME_MAX = 12;

/**
 * U5 가입 — 성별 · 생년월일 · 닉네임 → 가입 route → 휴대폰 인증
 *
 * @param param0
 * @returns
 */
export default function SignupContent({sns, returnUrl}: SignupContentProps): React.ReactNode {
    // 변수
    const router = useRouter(); // 가입 뒤 · 세션 만료 때 이동

    // 상태
    const [gender, setGender] = useState<GenderType>('');         // 성별
    const [birth, setBirth] = useState<string>('');               // 생년월일 YYYY-MM-DD
    const [nickname, setNickname] = useState<string>('');         // 닉네임
    const [submitting, setSubmitting] = useState<boolean>(false); // 가입 중 — 두 번 누름 막기

    // 계산 값
    const snsName = lookupName('sns_id', sns) || 'SNS'; // "카카오 계정으로 가입해요"

    // 함수
    function changeBirth(event: ChangeEvent<HTMLInputElement>): void {
        // 숫자만 쳐도 YYYY-MM-DD
        setBirth(formatBirthInput(event.target.value));
    }

    function changeNickname(event: ChangeEvent<HTMLInputElement>): void {
        // 12자까지
        setNickname(event.target.value.slice(0, NICKNAME_MAX));
    }

    async function submit(): Promise<void> {
        // 화면 DTO 검증 → 가입 route → 휴대폰 인증 / 세션 만료면 로그인
        const dto = Object.assign(new SignupDto(), {gender, birth, nickname});
        if (submitting || !(await validateAction(dto))) {
            return;
        }

        // 성공 · 세션 만료는 다른 화면으로 가므로 버튼을 막아 둔 채로(가입 뒤 다시 누르면 세션이 없어 로그인으로 가 버린다)
        setSubmitting(true);
        try {
            const result = await signWithSns({gender, birth, nickname});
            if (result.state === 'no-sns') {
                showErrorPopup(SNS_EXPIRED_MESSAGE);
                router.replace(loginUrl('user', returnUrl));
                return;
            }

            router.replace(afterLoginPath(result.is_phone_verified, returnUrl));
        } catch (error) {
            handleApiError(error);
            setSubmitting(false);
        }
    }

    return (
        // 가입
        <div className={styles.page}>
            {/* 상단 바 */}
            <UserTopBar title="가입" backHref={loginUrl('user', returnUrl)} />

            <div className={styles.body}>
                {/* 안내 */}
                <div className={styles.intro}>
                    <div className={styles.sns}>
                        <Badge>{snsName}</Badge>
                        <span>계정으로 가입해요</span>
                    </div>
                    <h2 className={styles.heading}>예약에 쓸 정보를 입력해 주세요</h2>
                </div>

                {/* 성별 */}
                <Field label="성별" name="gender" group>
                    <div className={styles.genders}>
                        {GENDER_OPTIONS.map((option) => (
                            <label key={option.value} className={gender === option.value ? `${styles.gender} ${styles.selected}` : styles.gender}>
                                <input type="radio" name="gender" value={option.value} checked={gender === option.value} onChange={() => setGender(option.value)} />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </Field>

                {/* 생년월일 */}
                <Field label="생년월일" name="birth" htmlFor="signup-birth" hint="예: 1998-03-14 · 만 19세가 되는 해의 1월 1일부터 가입할 수 있어요.">
                    <Input id="signup-birth" inputMode="numeric" autoComplete="bday" placeholder="1998-03-14" value={birth} onChange={changeBirth} />
                </Field>

                {/* 닉네임 */}
                <Field label="닉네임" name="nickname" htmlFor="signup-nickname" hint={<span className={styles.meta}><span>최대 {NICKNAME_MAX}자, 특수문자는 쓸 수 없어요.</span><span className={styles.count}>{nickname.length}/{NICKNAME_MAX}</span></span>}>
                    <Input id="signup-nickname" autoComplete="nickname" maxLength={NICKNAME_MAX} value={nickname} onChange={changeNickname} />
                </Field>
            </div>

            {/* 가입하기 */}
            <div className={styles.footer}>
                <Button variant="primary" size="lg" full onClick={submit} disabled={submitting}>가입하기</Button>
            </div>
        </div>
    );
}
