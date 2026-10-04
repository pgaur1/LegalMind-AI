export async function revealMarkdownLines(content, onUpdate, delayMs = 35) {
  const lines = content.match(/[^\n]*\n|[^\n]+$/g) || []
  let visibleContent = ''

  for (const line of lines) {
    visibleContent += line
    onUpdate(visibleContent)
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
}
