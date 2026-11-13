import { describe, expect, it } from 'vitest';
import { validate } from 'class-validator';
import { LoginDto } from './dto';

describe('LoginDto', () => {
    it('[SUCCESS] 아이디 · 비밀번호가 있으면 오류가 없다', async () => {
        const errors = await validate(new LoginDto({login_id: 'user', login_pw: 'password'}));

        expect(errors).toHaveLength(0);
    });

    it('[FAIL:empty] 비어 있으면 칸마다 한국어 메시지를 낸다', async () => {
        const errors = await validate(new LoginDto({login_id: '', login_pw: ''}));

        expect(errors.map((error) => [error.property, error.constraints?.isNotEmpty])).toEqual([
            ['login_id', '아이디를 입력해주세요.'],
            ['login_pw', '비밀번호를 입력해주세요.'],
        ]);
    });
});
