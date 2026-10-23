import fs from 'fs'
import path from 'path'

const web = fs.readFileSync(path.join(__dirname, '../../api/publicPlatform.ts'), 'utf8')
const webChannels = fs.readFileSync(path.join(__dirname, '../../api/channel.ts'), 'utf8')
const webVideos = fs.readFileSync(path.join(__dirname, '../../api/channelVideoPublic.ts'), 'utf8')
const mobile = fs.readFileSync(path.join(__dirname, '../../../../../mobile/src/api/endpoints.ts'), 'utf8')

describe('public platform API paths', () => {
  it('uses the same browse paths on web and native', () => {
    expect(web).toContain('/auditions/browse')
    expect(web).toContain('/agencies/public')
    expect(webChannels).toContain('/channels/public')
    expect(webVideos).toContain('/videos/browse')
    expect(mobile).toContain('/auditions/browse')
    expect(mobile).toContain('/channels/public')
    expect(mobile).toContain('/videos/browse')
    expect(mobile).toContain('/agencies/public')
  })
})