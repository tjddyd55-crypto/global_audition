const hosts = ['bilibili.com', 'www.bilibili.com', 'm.bilibili.com']
const videoPath = /^\/video\/(BV[A-Za-z0-9]{10}|av[1-9][0-9]{0,18})\/?$/
const shortPath = /^\/[A-Za-z0-9]{1,32}\/?$/

export type BilibiliLink =
  | { kind: 'video'; id: string; page: number; url: string }
  | { kind: 'short'; url: string }

function parse(text: string): BilibiliLink | null {
  if (/[\s\\<>"{}|^]/.test(text) || /%(?![a-f0-9]{2})/i.test(text)) return null
  const parts = /^https:\/\/([a-z0-9.-]+)(\/[^?#]*)?(?:\?([^#]*))?(?:#.*)?$/i.exec(text)
  if (!parts) return null
  const [, authority, path = '', query = ''] = parts
  const host = authority.toLowerCase()
  if (host === 'b23.tv' && shortPath.test(path)) {
    return { kind: 'short', url: 'https://b23.tv' + path + (query ? '?' + query : '') }
  }
  const id = hosts.includes(host) ? videoPath.exec(path)?.[1] : undefined
  if (!id) return null
  const pages = query.split('&').filter(part => part === 'p' || part.startsWith('p='))
  if (pages.length > 1 || (pages[0] && !/^p=[1-9][0-9]{0,5}$/.test(pages[0]))) return null
  const page = pages[0] ? Number(pages[0].slice(2)) : 1
  return { kind: 'video', id, page, url: 'https://www.bilibili.com/video/' + id + (page === 1 ? '' : '?p=' + page) }
}

export function bilibiliLink(raw: string): BilibiliLink | null {
  if (raw.length > 2048) return null
  const text = raw.trim()
  const direct = parse(text)
  if (direct || !/\s/.test(text) || /[<>]/.test(text)) return direct
  const links = Array.from(text.matchAll(/https:\/\/[^\s<>【】（）「」《》，。；！？]+/gi))
    .map(match => parse(match[0].replace(/[),.!]+$/, '')))
    .filter((link): link is BilibiliLink => link !== null)
  return links.length === 1 ? links[0] : null
}

export function bilibiliEmbed(video: Extract<BilibiliLink, { kind: 'video' }>, autoplay = false): string {
  const id = video.id.startsWith('BV') ? 'bvid=' + video.id : 'aid=' + video.id.slice(2)
  return 'https://player.bilibili.com/player.html?' + id + '&p=' + video.page
    + '&autoplay=' + (autoplay ? '1' : '0') + '&danmaku=0'
}
