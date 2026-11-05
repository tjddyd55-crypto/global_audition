package com.audition.platform.application.org;

/**
 * 기획사 공개 가입 시 CRM 신청에 남길 사업 정보.
 * 필수 여부는 프론트 폼과 맞추되, 하위 호환을 위해 서버는 비어 있어도 신청을 연다.
 */
public record AgencySignupProfile(
        String countryCode,
        String companyName,
        String legalName,
        String businessRegistrationNumber,
        String representativeName,
        String contactEmail,
        String contactPhone,
        String website,
        String businessCity,
        String taxId,
        String businessAddress,
        Integer establishedYear,
        String businessLicenseDocumentUrl) {

    public static AgencySignupProfile fromSignup(
            String countryCode,
            String companyName,
            String legalName,
            String legacyName,
            String businessRegistrationNumber,
            String representativeName,
            String contactEmail,
            String contactPhone,
            String website,
            String businessCity,
            String taxId,
            String businessAddress,
            Integer establishedYear,
            String businessLicenseDocumentUrl) {
        String legal = firstNonBlank(legalName, legacyName);
        return new AgencySignupProfile(
                countryCode,
                blankToNull(companyName),
                legal,
                blankToNull(businessRegistrationNumber),
                blankToNull(representativeName),
                blankToNull(contactEmail),
                blankToNull(contactPhone),
                blankToNull(website),
                blankToNull(businessCity),
                blankToNull(taxId),
                blankToNull(businessAddress),
                establishedYear,
                blankToNull(businessLicenseDocumentUrl));
    }

    private static String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        return blankToNull(fallback);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
