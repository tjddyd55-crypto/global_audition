type MessageTree = Record<string, unknown>

export function deepMergeMessages(fallback: MessageTree, override: MessageTree): MessageTree {
  const out: MessageTree = { ...fallback }
  for (const [key, value] of Object.entries(override)) {
    const current = out[key]
    if (isTree(current) && isTree(value)) {
      out[key] = deepMergeMessages(current, value)
    } else {
      out[key] = value
    }
  }
  return out
}

export function collectMessageKeys(tree: MessageTree, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (isTree(value)) {
      keys.push(...collectMessageKeys(value, path))
    } else {
      keys.push(path)
    }
  }
  return keys.sort()
}

function isTree(value: unknown): value is MessageTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
