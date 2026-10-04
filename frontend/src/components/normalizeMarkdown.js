export const normalizeMarkdown = (content) => {
  if (typeof content !== 'string') return ''

  const unwrapped = content.replace(
    /^\s*```(?:markdown|md)\s*\n([\s\S]*?)\n```\s*$/i,
    '$1',
  )

  return unwrapped
    .split('\n')
    .flatMap((line) => {
      if (!/\|\s*:?-{3,}:?\s*\|/.test(line)) return [line]
      return line.replace(/\|\s+\|/g, '|\n|').split('\n')
    })
    .join('\n')
}
