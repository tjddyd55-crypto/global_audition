import axios from 'axios'
import { ApiFetchError } from '@/shared/api/apiFetch'
import { AUDITION_IMAGE_ERROR } from '@/shared/audition/auditionImageRules'
import { UPLOAD_ERROR } from '@/shared/api/uploadErrorCodes'
import { mapApiErrorCode } from './mapApiError'

const CODE_TO_CATALOG: Record<string, string> = {
  [UPLOAD_ERROR.NO_URL]: 'uploader.noUrl',
  [UPLOAD_ERROR.TIMEOUT]: 'uploader.timeout',
  [UPLOAD_ERROR.FAILED]: 'uploader.uploadFailed',
  [UPLOAD_ERROR.LOGIN_REQUIRED]: 'uploader.loginRequired',
  [UPLOAD_ERROR.FORBIDDEN]: 'uploader.forbidden',
  [UPLOAD_ERROR.RATE_LIMITED]: 'uploader.rateLimited',
  [UPLOAD_ERROR.TOO_LARGE]: 'uploader.fileTooLarge',
  [AUDITION_IMAGE_ERROR.TOO_LARGE]: 'uploader.fileTooLarge',
  [AUDITION_IMAGE_ERROR.INVALID_TYPE]: 'uploader.invalidType',
  UNAUTHORIZED: 'errors.UNAUTHORIZED',
  FORBIDDEN: 'errors.FORBIDDEN',
  LOGIN_REQUIRED: 'errors.UNAUTHORIZED',
  ACCESS_DENIED: 'errors.FORBIDDEN',
}

const STATUS_TO_CODE: Record<number, string> = {
  401: UPLOAD_ERROR.LOGIN_REQUIRED,
  403: UPLOAD_ERROR.FORBIDDEN,
  413: UPLOAD_ERROR.TOO_LARGE,
  429: UPLOAD_ERROR.RATE_LIMITED,
  503: UPLOAD_ERROR.FAILED,
}

export function bindCatalogTranslator(
  namespaces: Record<string, (key: string) => string>,
): (key: string) => string {
  return (key) => {
    const dot = key.indexOf('.')
    if (dot < 0) return key
    const translate = namespaces[key.slice(0, dot)]
    if (!translate) return key
    return translate(key.slice(dot + 1))
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function readPayload(e: unknown): { status?: number; body?: unknown; message?: string } {
  if (e instanceof ApiFetchError) {
    return { status: e.status, body: parseJson(e.bodyText), message: e.message }
  }
  if (axios.isAxiosError(e)) {
    return { status: e.response?.status, body: e.response?.data, message: e.message }
  }
  if (e instanceof Error) {
    return { message: e.message }
  }
  return {}
}

function catalogValue(translate: (key: string) => string, key: string): string {
  if (!key) return ''
  const mapped = translate(key)
  return mapped && mapped !== key ? mapped : ''
}

export function mapDisplayError(
  e: unknown,
  translate: (key: string) => string,
  fallback: string,
): string {
  const payload = readPayload(e)
  const fromBody = mapApiErrorCode(payload.body, translate, '')
  if (fromBody) return fromBody

  const rawCode = payload.message?.trim() ?? ''
  const fromMessage = catalogValue(translate, CODE_TO_CATALOG[rawCode] ?? '')
  if (fromMessage) return fromMessage

  if (payload.status != null) {
    const statusCode = STATUS_TO_CODE[payload.status]
    const fromStatus = statusCode ? catalogValue(translate, CODE_TO_CATALOG[statusCode] ?? '') : ''
    if (fromStatus) return fromStatus
  }

  return fallback
}
