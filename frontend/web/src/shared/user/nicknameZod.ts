import { z } from 'zod'

const NICKNAME_RE = /^[a-zA-Z0-9가-힣._]+$/

export type NicknameMessages = {
  required: string
  length: string
  charset: string
}

/** 백엔드 NicknamePolicy 와 동일한 클라이언트 검증. 문구는 카탈로그에서 받는다. */
export function createNicknameZodField(messages: NicknameMessages) {
  return z
    .string({ required_error: messages.required })
    .trim()
    .min(2, messages.length)
    .max(20, messages.length)
    .regex(NICKNAME_RE, messages.charset)
}
