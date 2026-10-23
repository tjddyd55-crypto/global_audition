import fs from 'fs'
import path from 'path'

const webStudio = fs.readFileSync(path.join(__dirname, '../../api/studio.ts'), 'utf8')
const webCredits = fs.readFileSync(path.join(__dirname, '../../api/credits.ts'), 'utf8')
const webChannel = fs.readFileSync(path.join(__dirname, '../../api/channel.ts'), 'utf8')
const webProfile = fs.readFileSync(path.join(__dirname, '../../api/meProfile.ts'), 'utf8')
const mobile = fs.readFileSync(
  path.join(__dirname, '../../../../../mobile/src/api/endpoints.ts'),
  'utf8',
)

describe('web and native studio APIs', () => {
  it('uses the same profile, channel, notification, and credit paths', () => {
    expect(webProfile).toContain("'/me'")
    expect(mobile).toContain("'/me'")
    expect(webChannel).toContain("'/me/channel'")
    expect(mobile).toContain("'/me/channel'")
    expect(webStudio).toContain("'/me/notifications'")
    expect(webStudio).toContain('/read')
    expect(mobile).toContain('/me/notifications')
    expect(mobile).toContain('/read')
    expect(webCredits).toContain("'/credits/balance'")
    expect(mobile).toContain("'/credits/balance'")
  })
})