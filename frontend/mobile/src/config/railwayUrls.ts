/** Railway develop 환경 (로컬 Metro / preview EAS 기본). */
export const RAILWAY_DEVELOP_WEB_URL = 'https://frontend-develop-3d3e.up.railway.app'

/** Railway production 환경 (production-apk / production EAS 전용). */
export const RAILWAY_PRODUCTION_WEB_URL = 'https://frontend-production-8613a.up.railway.app'

export function apiUrlForWebOrigin(webUrl: string): string {
  return `${webUrl.replace(/\/+$/, '')}/api`
}
