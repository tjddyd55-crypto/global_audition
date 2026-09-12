import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const QUOTED_HANGUL = /['"`]([^'"`]*[가-힣][^'"`]*)['"`]/g

const CATALOGUED_FILES = [
  'src/components/application/applyForm/ApplyBasicInfoSection.tsx',
  'src/components/application/applyForm/ApplyVideoSection.tsx',
  'src/components/application/applyForm/ApplySnsSection.tsx',
  'src/components/application/applyForm/ApplyIntroSection.tsx',
  'src/components/application/applyForm/ApplySubmitButton.tsx',
  'src/components/application/applyForm/ApplyFormAlerts.tsx',
  'src/components/auth/RoleSelectCard.tsx',
  'src/pc/pages/auth/RegisterPage.tsx',
  'src/shared/audition/auditionEditorCopy.ts',
  'src/pc/pages/auditions/ListPage.tsx',
  'src/mobile/pages/auditions/ListPage.tsx',
  'src/components/audition/AuditionListContent.tsx',
  'src/components/audition/manage/ApplicantStatsGrid.tsx',
  'src/components/audition/manage/detail/ApplicantStatusConfirmDialog.tsx',
  'src/components/audition/manage/detail/ApplicantDetailBasicInfo.tsx',
  'src/components/audition/manage/detail/ApplicantDetailSnsSection.tsx',
  'src/components/audition/AuditionManageList.tsx',
  'src/components/audition/ApplicantManagementView.tsx',
  'src/components/audition/manage/ApplicantManagementFilterPanel.tsx',
  'src/components/audition/manage/ApplicantCategoryFilterChips.tsx',
  'src/components/audition/manage/ApplicantRoundTabs.tsx',
  'src/components/audition/manage/ApplicantEmptyListState.tsx',
  'src/components/audition/manage/ApplicantManagementHeader.tsx',
  'src/components/channel/ChannelMeStudioForm.tsx',
  'src/components/channel/ChannelSettingsPanel.tsx',
  'src/components/channel/ChannelPublicVideoList.tsx',
  'src/app/[locale]/channel/[userId]/page.tsx',
  'src/app/[locale]/vault/[id]/page.tsx',
  'src/components/audition/AuditionRankingBoard.tsx',
  'src/components/application/ApplicationForm.tsx',
  'src/components/application/ApplicationRoundTimeline.tsx',
  'src/components/agency/AgencyDashboardShell.tsx',
  'src/components/audition/PublicVoteBoard.tsx',
  'src/components/audition/AuditionAudienceFilter.tsx',
  'src/shared/channel/nationalityDisplay.ts',
]

describe('catalogued user-facing files', () => {
  it('have no leftover quoted Hangul literals', () => {
    const leftovers: string[] = []
    for (const rel of CATALOGUED_FILES) {
      const text = readFileSync(resolve(__dirname, '../../../../', rel), 'utf8')
      const withoutComments = text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      for (const match of withoutComments.matchAll(QUOTED_HANGUL)) {
        leftovers.push(`${rel}: ${match[1]}`)
      }
    }
    expect(leftovers).toEqual([])
  })
})
