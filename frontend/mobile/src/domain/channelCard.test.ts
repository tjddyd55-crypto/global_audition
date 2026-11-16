import { channelCardView } from './channelCard'

const fb = { name: 'Untitled channel', intro: 'No description' }

describe('channelCardView', () => {
  it('uses avatar, intro and counts from the public channel row', () => {
    const v = channelCardView(
      { userId: 'u1', nickname: 'nova', introText: '  Hello  ', profileImage: 'https://cdn.example.com/a.jpg', subscriberCount: 3, videoCount: 2 },
      fb,
    )
    expect(v).toMatchObject({ userId: 'u1', name: 'nova', intro: 'Hello', hasIntro: true, avatarUri: 'https://cdn.example.com/a.jpg', initial: 'N', subscribers: 3, videos: 2 })
  })
  it('falls back to placeholder avatar for missing / svg / relative images and a translated intro hint', () => {
    expect(channelCardView({ userId: 'u2', nickname: 'qa_user', profileImage: '/avatar-default.svg' }, fb)).toMatchObject({
      avatarUri: null,
      intro: 'No description',
      hasIntro: false,
      subscribers: 0,
      videos: 0,
    })
    expect(channelCardView({ userId: 'u3', nickname: 'x', profileImage: 'https://h/a.svg' }, fb).avatarUri).toBeNull()
    expect(channelCardView({ userId: 'u4' }, fb)).toMatchObject({ name: 'Untitled channel', initial: 'U', avatarUri: null })
  })
  it('handles non-latin names for the initial', () => {
    expect(channelCardView({ userId: 'u5', nickname: '노바' }, fb).initial).toBe('노')
  })
})
