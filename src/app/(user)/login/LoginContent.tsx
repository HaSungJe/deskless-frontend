'use client';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAccessToken, setRefreshToken } from '@/shared/api/cookie';
import { handleApiError } from '@/shared/api/error';
import { request } from '@/shared/api/request';
import Loading from '@/shared/components/Loading';
import useInput, { UseInputType } from '@/shared/hooks/useInput';
import { IsLoginContext, RootLayoutLoadingContext } from '@/shared/providers/RootLayoutProvider';
import { validateAction } from '@/shared/utils/validation';
import { LoginDto } from './dto';

/** 로그인 응답 — 예전 백엔드 기준 */
type LoginResultType = {
    access_token: string;
    access_token_end_dt: string;
    refresh_token: string;
    refresh_token_end_dt: string;
};

/**
 * 로그인 — 예전 백엔드(아이디 · 비밀번호) 기준. Phase 5 에서 지침서 U5(카카오 · 네이버)로 바뀐다
 *
 * @returns
 */
export default function LoginContent(): React.ReactNode {
    // 변수
    const router = useRouter();                                              // 로그인 뒤 첫 화면으로
    const rootLayoutLoading: boolean = useContext(RootLayoutLoadingContext); // 로그인 상태 확인 중인지
    const isLogin: boolean = useContext(IsLoginContext);                     // 이미 로그인했는지

    // 상태
    const [loading, setLoading] = useState<boolean>(true);    // 화면 준비 중(로그인 상태 확인 · 저장한 아이디 채우기)
    const [isSaveId, setIsSaveId] = useState<boolean>(false); // 아이디 저장 선택
    const loginId: UseInputType = useInput('');               // 아이디 칸
    const loginPw: UseInputType = useInput('');               // 비밀번호 칸

    // 효과
    useEffect(() => {
        // 이미 로그인했으면 첫 화면으로, 아니면 저장한 아이디를 채운다
        if (rootLayoutLoading) {
            setLoading(true);
        } else if (isLogin) {
            router.push('/');
        } else {
            const saveId: string = localStorage.getItem('saveId');
            if (saveId) {
                setIsSaveId(true);
                loginId.setValue(saveId);
            }
            setLoading(false);
        }
    }, [rootLayoutLoading, isLogin]);

    // 함수
    async function login(): Promise<void> {
        const dto = new LoginDto({login_id: loginId.value, login_pw: loginPw.value});
        if (!(await validateAction(dto))) {
            return;
        }

        try {
            const result = await request<LoginResultType>({method: 'POST', path: '/user/login', body: dto});
            if (!result) {
                return;
            }

            // 아이디 저장을 골랐으면 저장, 아니면 지운다
            if (isSaveId) {
                localStorage.setItem('saveId', loginId.value);
            } else {
                localStorage.removeItem('saveId');
            }

            // 토큰 쿠키 저장
            await setRefreshToken(result.refresh_token, result.refresh_token_end_dt);
            await setAccessToken(result.access_token, result.access_token_end_dt);
            router.push('/');
        } catch (error) {
            handleApiError(error);
        }
    }

    async function enterScope(event: React.KeyboardEvent<HTMLInputElement>): Promise<void> {
        if (event.key === 'Enter') {
            await login();
        }
    }

    function toggleSaveId(): void {
        setIsSaveId(!isSaveId);
    }

    if (loading) {
        return (
            // 로그인 상태 확인 중
            <Loading />
        );
    }

    return (
        // 로그인 폼
        <>
            <table>
                <colgroup>
                    <col style={{width: '20%'}} />
                    <col style={{width: '80%'}} />
                </colgroup>
                <tbody>
                    {/* 아이디 */}
                    <tr>
                        <th>아이디</th>
                        <td>
                            <input type="text" value={loginId.value} onChange={loginId.onChange} onKeyDown={enterScope} />
                            <span data-type="validation-alert" data-id="login_id" />
                        </td>
                    </tr>

                    {/* 비밀번호 */}
                    <tr>
                        <th>비밀번호</th>
                        <td>
                            <input type="password" value={loginPw.value} onChange={loginPw.onChange} onKeyDown={enterScope} />
                            <span data-type="validation-alert" data-id="login_pw" />
                        </td>
                    </tr>

                    {/* 아이디 저장 */}
                    <tr>
                        <th>아이디 저장</th>
                        <td>
                            <input type="checkbox" className="checkbox" id="save-id-checkbox" checked={isSaveId} onChange={toggleSaveId} />
                            <label htmlFor="save-id-checkbox">아이디 저장하기</label>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 로그인 버튼 */}
            <button type="button" onClick={login}>로그인</button>
        </>
    );
}
