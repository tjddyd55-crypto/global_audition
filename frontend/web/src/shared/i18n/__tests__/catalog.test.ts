import { collectMessageKeys, deepMergeMessages } from '../mergeMessages'
import ko from '../../../../messages/ko.json'
import en from '../../../../messages/en.json'
import mn from '../../../../messages/mn.json'
import locales from '../../../../messages/locales.json'

describe('i18n catalogs', () => {
  it('keeps ko/en/mn key-complete against each other', () => {
    const koKeys = collectMessageKeys(ko)
    const enKeys = collectMessageKeys(en)
    const mnKeys = collectMessageKeys(mn)
    expect(enKeys).toEqual(koKeys)
    expect(mnKeys).toEqual(koKeys)
  })

  it('has no empty primary strings', () => {
    for (const [name, tree] of [
      ['ko', ko],
      ['en', en],
      ['mn', mn],
    ] as const) {
      for (const key of collectMessageKeys(tree)) {
        const value = key.split('.').reduce<unknown>((acc, part) => (acc as Record<string, unknown>)[part], tree)
        expect(typeof value).toBe('string')
        expect(String(value).trim().length).toBeGreaterThan(0)
        expect(name).toBeTruthy()
      }
    }
  })

  it('fails when any primary locale is missing a key', () => {
    const koKeys = new Set(collectMessageKeys(ko))
    const enKeys = new Set(collectMessageKeys(en))
    const mnKeys = new Set(collectMessageKeys(mn))
    const missingInEn = [...koKeys].filter((key) => !enKeys.has(key))
    const missingInMn = [...koKeys].filter((key) => !mnKeys.has(key))
    expect(missingInEn).toEqual([])
    expect(missingInMn).toEqual([])
  })

  it('maps payment and credit error codes in all primary catalogs', () => {
    for (const tree of [ko, en, mn] as const) {
      const errors = (tree as { errors: Record<string, string> }).errors
      expect(errors.INSUFFICIENT_CREDITS.trim().length).toBeGreaterThan(0)
      expect(errors.CONFIG_INCOMPLETE.trim().length).toBeGreaterThan(0)
      expect(errors.TOSS_INACTIVE.trim().length).toBeGreaterThan(0)
      expect(errors.AMOUNT_MISMATCH.trim().length).toBeGreaterThan(0)
    }
  })

  it('keeps apply/vote/agency/vault/channel/editor namespaces aligned', () => {
    const required = [
      'apply.sectionBasic',
      'apply.vaultAttach',
      'vote.cheerHint',
      'vote.allCategories',
      'agency.filter',
      'agency.manageTitle',
      'agency.dashboard',
      'vault.expertReview',
      'channel.settingsTitle',
      'channel.studioTitle',
      'editor.statusOpen',
      'editor.addItem',
      'auditions.filterRegion',
      'ranking.backToAudition',
      'application.roundProgress',
      'native.otaTitle',
      'dashboard.title',
      'myAuditions.create',
      'roundReview.title',
      'auditionDetail.statusOpenBadge',
      'apply.roundApplyCta',
      'myApplications.listTitle',
      'dashboard.statsHint',
      'profile.noThumbnail',
      'editor.createNew',
      'channel.firstVideo',
      'relative.justNow',
      'errors.PREVIOUS_ROUND_NOT_PASSED',
      'agency.detailLoadFailed',
      'editor.editPosting',
      'home.latestVideosHint',
      'video.viewsCount',
      'video.browseTitle',
      'video.commentsCount',
      'home.seeAllAuditions',
      'channel.listTitle',
      'profile.manageTitle',
      'uploader.invalidType',
      'gallery.empty',
      'auth.identifyHint',
      'device.viewPc',
      'common.errorTemp',
      'fallback.videoTitle',
      'uploader.loginRequired',
    ]
    for (const tree of [ko, en, mn] as const) {
      const keys = new Set(collectMessageKeys(tree))
      for (const key of required) {
        expect(keys.has(key)).toBe(true)
      }
    }
  })

  it('keeps user-facing namespaces on ko/en/mn', () => {
    for (const tree of [ko, en, mn] as const) {
      const root = tree as Record<string, Record<string, string>>
      expect(root.apply.sectionBasic).toBeTruthy()
      expect(root.vote.cheerHint).toBeTruthy()
      expect(root.vault.title).toBeTruthy()
      expect(root.channel.save).toBeTruthy()
      expect(root.editor.statusOpen).toBeTruthy()
      expect(root.editor.titlePlaceholder).toBeTruthy()
      expect(root.auditions.filterRegion).toBeTruthy()
      expect(root.auditions.filterHint).toBeTruthy()
      expect(root.native.otaTitle).toBeTruthy()
      expect(root.agency.confirmPass).toBeTruthy()
      expect(root.agency.filter).toBeTruthy()
      expect(root.agency.manageTitle).toBeTruthy()
      expect(root.agency.dashboard).toBeTruthy()
      expect(root.nationality.unspecified).toBeTruthy()
      expect(root.channel.settingsTitle).toBeTruthy()
      expect(root.channel.studioTitle).toBeTruthy()
      expect(root.channel.emptyVideos).toBeTruthy()
      expect(root.vault.expertReview).toBeTruthy()
      expect(root.vault.notFound).toBeTruthy()
      expect(root.ranking.name).toBeTruthy()
      expect(root.ranking.backToAudition).toBeTruthy()
      expect(root.apply.vaultAttach).toBeTruthy()
      expect(root.application.roundProgress).toBeTruthy()
      expect(root.dashboard.title).toBeTruthy()
      expect(root.myAuditions.create).toBeTruthy()
      expect(root.roundReview.title).toBeTruthy()
      expect(root.auditionDetail.statusOpenBadge).toBeTruthy()
      expect(root.apply.roundApplyCta).toBeTruthy()
      expect(root.myApplications.listTitle).toBeTruthy()
      expect(root.dashboard.statsHint).toBeTruthy()
      expect(root.profile.noThumbnail).toBeTruthy()
      expect(root.editor.createNew).toBeTruthy()
      expect(root.channel.firstVideo).toBeTruthy()
      expect(root.relative.justNow).toBeTruthy()
      expect(root.errors.PREVIOUS_ROUND_NOT_PASSED).toBeTruthy()
      expect(root.agency.detailLoadFailed).toBeTruthy()
      expect(root.editor.editPosting).toBeTruthy()
      expect(root.home.latestVideosHint).toBeTruthy()
      expect(root.video.viewsCount).toBeTruthy()
      expect(root.video.browseTitle).toBeTruthy()
      expect(root.video.commentsCount).toBeTruthy()
      expect(root.home.seeAllAuditions).toBeTruthy()
      expect(root.channel.listTitle).toBeTruthy()
      expect(root.profile.manageTitle).toBeTruthy()
      expect(root.uploader.invalidType).toBeTruthy()
      expect(root.gallery.empty).toBeTruthy()
      expect(root.auth.identifyHint).toBeTruthy()
      expect(root.device.viewPc).toBeTruthy()
      expect(root.common.errorTemp).toBeTruthy()
      expect(root.fallback.videoTitle).toBeTruthy()
      expect(root.uploader.loginRequired).toBeTruthy()
    }
  })

  it('lists mn as a first-class locale', () => {
    expect(locales.primary).toEqual(['ko', 'en', 'mn'])
    expect(locales.supported).toContain('mn')
    expect(locales.settlementCurrency).toBe('USD')
  })

  it('merges english fallback for incomplete locales', () => {
    const merged = deepMergeMessages(en as Record<string, unknown>, { common: { login: 'ログイン' } })
    expect((merged.common as Record<string, unknown>).login).toBe('ログイン')
    expect((merged.home as Record<string, unknown>).openAuditions).toBe((en.home as Record<string, string>).openAuditions)
  })
})
