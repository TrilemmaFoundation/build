import fs from 'node:fs';
import path from 'node:path';

import {stripFrontmatter as stripFrontmatterBody} from './frontmatterUtils.mjs';
import {markdownCodeRanges} from './markdownCodeUtils.mjs';

const WORDS_PER_MINUTE = 225;

export function stripMdxBoilerplate(content) {
  for (const {start, end} of markdownCodeRanges(content).filter((range) => !range.inline).reverse()) {
    content = `${content.slice(0, start)}\n${content.slice(end)}`;
  }
  return content
    .replace(/^import\s.+?;?\s*$/gm, '')
    .replace(/^export\s.+?;?\s*$/gm, '')
    .replace(/<[^>\n]+>/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*_~|[\]{}()]/g, ' ');
}

export function countReadableWords(content) {
  const words = stripMdxBoilerplate(stripFrontmatterBody(content))
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  return words.length;
}

export function calculateReadMinutes(content) {
  return Math.max(1, Math.ceil(countReadableWords(content) / WORDS_PER_MINUTE));
}

/**
 * @param {{siteDir: string, docRoots: string[]}} options
 * @returns {Record<string, number>}
 */
export function buildDocReadTimes({siteDir, docRoots}) {
  /** @type {Record<string, number>} */
  const readTimes = {};

  for (const docRoot of docRoots) {
    const absoluteRoot = path.join(siteDir, docRoot);
    if (!fs.existsSync(absoluteRoot)) {
      continue;
    }

    for (const filePath of walkMarkdownFiles(absoluteRoot)) {
      const relativePath = path.relative(siteDir, filePath).split(path.sep).join('/');
      const source = `@site/${relativePath}`;
      const content = fs.readFileSync(filePath, 'utf8');
      readTimes[source] = calculateReadMinutes(content);
    }
  }

  return readTimes;
}

function walkMarkdownFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, {withFileTypes: true});

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}
