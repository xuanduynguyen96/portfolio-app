/**
 * Prose words of a Markdown body. Code, HTML comments/tags, hidden elements, images, link
 * definitions and URLs don't count, so a case study can't be padded with pasted code or links.
 */
export function proseWords(markdown: string): string[] {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(\w+)\b[^>]*\b(?:hidden|aria-hidden=["']true["'])[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  return prose.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
}

export function countWords(markdown: string): number {
  return proseWords(markdown).length;
}

/** Distinct words, case-insensitive. */
export function countUniqueWords(markdown: string): number {
  return new Set(proseWords(markdown).map((word) => word.toLowerCase())).size;
}
