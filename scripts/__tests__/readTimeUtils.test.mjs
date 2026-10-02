import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {compile} from '@mdx-js/mdx';

import {
  buildDocReadTimes,
  calculateReadMinutes,
  countReadableWords,
  stripMdxBoilerplate,
} from '../readTimeUtils.mjs';

test('stripMdxBoilerplate removes import and export lines', () => {
  const content = [
    "import Widget from '@site/src/Widget';",
    'export const value = 1;',
    '',
    'Readable words remain.',
  ].join('\n');

  assert.equal(stripMdxBoilerplate(content).trim(), 'Readable words remain.');
});

test('calculateReadMinutes returns a minimum of one minute', () => {
  assert.equal(calculateReadMinutes('short'), 1);
});

test('calculateReadMinutes rounds up using 225 words per minute', () => {
  const content = Array.from({length: 226}, (_, index) => `word${index}`).join(' ');
  assert.equal(calculateReadMinutes(content), 2);
});

test('reading time excludes equivalent fences and nested blocks', () => {
  const code = 'value '.repeat(226);
  for (const block of [
    `~~~text\n${code}\n~~~`,
    `\`\`\`\`text\n${code}\n\`\`\`\n\`\`\`\``,
    `  ~~~text\r\n  ${code}\r\n  ~~~~  \r\n`,
    `> ~~~text\n> ${code}\n> ~~~`,
    `- \`\`\`text\n  ${code}\n  \`\`\``,
    `> - ~~~text\n>   ${code}\n>   ~~~`,
    `~~~text\n${code}\n\n`,
    `<div>\n~~~text\n${code}\n~~~\n</div>`,
  ]) {
    assert.equal(countReadableWords(`Intro\n\n${block}`), 1);
    assert.equal(calculateReadMinutes(`Intro\n\n${block}`), 1);
  }
  assert.equal(calculateReadMinutes(`Intro\n\n${code}`), 2);
});

test('reading time counts indented prose according to native MDX', async () => {
  const content = `Intro\n\n    ${'value '.repeat(226)}\n`;
  assert.doesNotMatch(String(await compile(content)), /pre: "pre"|code: "code"/);
  assert.equal(countReadableWords(content), 227);
  assert.equal(calculateReadMinutes(content), 2);
});

test('countReadableWords ignores markdown link targets', () => {
  assert.equal(countReadableWords('[Read docs](https://example.com) now'), 3);
});

test('stripMdxBoilerplate removes markup and code noise', () => {
  const content = [
    '<Widget>hidden tag</Widget>',
    '```js',
    'const ignored = true;',
    '```',
    '`inline code` and **readable** text.',
  ].join('\n');
  assert.equal(countReadableWords(content), 7);
});

test('buildDocReadTimes scans nested Markdown and skips missing roots and other files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'read-times-'));
  try {
    fs.mkdirSync(path.join(root, 'docs', 'nested'), {recursive: true});
    fs.writeFileSync(path.join(root, 'docs', 'one.md'), 'one two three', 'utf8');
    fs.writeFileSync(path.join(root, 'docs', 'nested', 'two.mdx'), 'four five', 'utf8');
    fs.writeFileSync(path.join(root, 'docs', 'nested', 'ignored.txt'), 'ignored', 'utf8');

    assert.deepEqual(
      buildDocReadTimes({siteDir: root, docRoots: ['missing', 'docs']}),
      {
        '@site/docs/nested/two.mdx': 1,
        '@site/docs/one.md': 1,
      },
    );
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});
