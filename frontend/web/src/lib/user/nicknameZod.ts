import { z } from 'zod'

const NICKNAME_RE = /^[a-zA-Z0-9가-힣._]+$/

/** 백엔드 {@code NicknamePolicy} 와 동일한 클라이언트 검증. */
export const nicknameZodField = z
  .string({ required_error: '닉네임을 입력하세요' })
  .trim()
  .min(2, '닉네임은 2~20자입니다')
  .max(20, '닉네임은 2~20자입니다')
  .regex(NICKNAME_RE, '한글·영문·숫자·밑줄·점만 사용할 수 있습니다')
