import type { SignupRequest } from '@/shared/api/auth'

export type AgencySignupFormFields = {
  email: string
  password: string
  nickname: string
  /** 개인 실명(선택). 하위 호환용. */
  name?: string | null
  countryCode: string
  companyName: string
  legalName: string
  businessRegistrationNumber: string
  representativeName: string
  contactEmail?: string | null
  contactPhone?: string | null
  website?: string | null
  businessCity: string
  taxId?: string | null
  businessAddress?: string | null
  establishedYear?: number | null
  businessLicenseDocumentUrl?: string | null
}

function trimOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

/** 기획사 가입 폼 값을 /auth/signup 요청 본문으로 만든다. 누락 필드를 다시 버리지 않는다. */
export function buildAgencySignupPayload(fields: AgencySignupFormFields): SignupRequest {
  return {
    email: fields.email.trim(),
    password: fields.password,
    role: 'AGENCY',
    nickname: fields.nickname.trim(),
    name: trimOrUndefined(fields.name),
    countryCode: fields.countryCode.trim().toUpperCase(),
    companyName: fields.companyName.trim(),
    legalName: fields.legalName.trim(),
    businessRegistrationNumber: fields.businessRegistrationNumber.trim(),
    representativeName: fields.representativeName.trim(),
    contactEmail: trimOrUndefined(fields.contactEmail),
    contactPhone: trimOrUndefined(fields.contactPhone),
    website: trimOrUndefined(fields.website),
    businessCity: fields.businessCity.trim(),
    taxId: trimOrUndefined(fields.taxId),
    businessAddress: trimOrUndefined(fields.businessAddress),
    establishedYear: fields.establishedYear ?? undefined,
    businessLicenseDocumentUrl: trimOrUndefined(fields.businessLicenseDocumentUrl),
  }
}
