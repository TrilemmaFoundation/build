/**
 * MDX/Markdown helpers for scripts/generate-llms-full.mjs (plain-text LLM bundles).
 */

import {stripFrontmatter as stripFrontmatterBody} from './frontmatterUtils.mjs';
import {markdownCodeRanges} from './markdownCodeUtils.mjs';

/** Strip display JSX from prose while preserving fenced code byte-for-byte. */
export function stripMdxForPlainText(text) {
  const ranges = markdownCodeRanges(text);
  const inlineRanges = ranges.filter((range) => range.inline);
  const segments = [];
  let offset = 0;
  for (const {start, end, inline} of ranges) {
    if (inline) continue;
    const cleaned = stripJsxFromProse(text.slice(offset, start), inlineRanges, offset)
      .replace(/\n{3,}/g, '\n\n');
    segments.push(segments.length ? cleaned : cleaned.trimStart(), text.slice(start, end));
    offset = end;
  }
  const tail = stripJsxFromProse(text.slice(offset), inlineRanges, offset)
    .replace(/\n{3,}/g, '\n\n').trimEnd();
  segments.push(segments.length ? tail : tail.trimStart());
  return segments.join('');
}

function stripJsxFromProse(text, inlineRanges, offset) {
  // Mask inline literals so paired display components can still be removed whole.
  let marker = '\uE000';
  while (text.includes(marker)) marker += '\uE000';
  const literals = [];
  for (const range of inlineRanges.filter((range) =>
    range.start >= offset && range.end <= offset + text.length).reverse()) {
    const start = range.start - offset;
    const end = range.end - offset;
    literals.push(text.slice(start, end));
    text = `${text.slice(0, start)}${marker}${literals.length - 1}${marker}${text.slice(end)}`;
  }
  let out = text
    // Whole-line MDX imports only (do not eat instructional prose after the specifier).
    .replace(/^import\s[\s\S]*?\sfrom\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/<[A-Z][A-Za-z0-9]*\b[^<>]*\/>/g, '');

  // Remove innermost paired components first so nested same-name tags fully clear.
  const innermostPaired =
    /<([A-Z][A-Za-z0-9]*)\b[^>]*>(?:(?!<[A-Z][A-Za-z0-9]*\b)[\s\S])*?<\/\1>/g;
  for (let i = 0; i < 32; i += 1) {
    const next = out.replace(innermostPaired, '');
    if (next === out) {
      break;
    }
    out = next;
  }

  out = out.replace(
    /<(?:ul|ol|div|span|section|article)\b[^>]*>[\s\S]*?<\/(?:ul|ol|div|span|section|article)>/gi,
    (block) => (block.includes('{') ? '' : block),
  );
  return out.replace(new RegExp(`${marker}(\\d+)${marker}`, 'g'), (_, index) => literals[Number(index)]);
}

export function stripYamlFrontmatter(text) {
  return stripFrontmatterBody(text, {trim: true});
}

export function stripFrontmatterAndMdxForLlms(text) {
  return stripMdxForPlainText(stripFrontmatterBody(text));
}
