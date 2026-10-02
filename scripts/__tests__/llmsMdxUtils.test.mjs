import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {compile} from '@mdx-js/mdx';

import {
  stripFrontmatterAndMdxForLlms,
  stripMdxForPlainText,
  stripYamlFrontmatter,
} from '../llmsMdxUtils.mjs';

describe('llmsMdxUtils', () => {
  it('preserves literal JSX in inline code and nested code blocks', () => {
    for (const source of [
      'Use `<Widget />` to render the chart.',
      'Use ``<Widget prop={`value`} />`` with a literal backtick.',
      '> ```jsx\n> <Widget />\n> ```',
      '> > ~~~jsx\r\n> > <Widget />\r\n> > ~~~~  \r\n',
      '- Example:\n\n  ```jsx\n  <Widget />\n  ```',
      '> - Example:\n>\n>   ~~~jsx\n>   <Widget />\n>   ~~~',
      '\uE000\uE0000\uE000\uE000 Use `<Widget />` literally.',
    ]) {
      assert.equal(stripMdxForPlainText(source), source);
    }
  });

  it('preserves native MDX code inside HTML containers and removes indented display JSX', async () => {
    for (const source of [
      '<div>\nUse `<Widget />` literally.\n</div>',
      '<div>\nUse `<Token />`.\n~~~jsx\n<Widget />\n~~~\nUse `<Other />`.\n</div>',
      '<div>\r\n~~~jsx\r\n<Widget />\r\n~~~\r\n</div>',
    ]) {
      assert.match(String(await compile(source)), /code: "code"/);
      assert.equal(stripMdxForPlainText(source), source);
    }
    const indented = '    <Widget />\n';
    assert.match(String(await compile(indented)), /_jsx\(Widget, \{\}\)/);
    assert.equal(stripMdxForPlainText(indented), '');
    // Existing fence preservation also retains component delimiters spanning code.
    const wrapped = '<Card>\n\n```jsx\n<Widget />\n```\n\n</Card>';
    assert.equal(stripMdxForPlainText(wrapped), wrapped);
  });

  it('removes real display JSX around inline code and after an unclosed quote fence', () => {
    assert.equal(
      stripMdxForPlainText('<Widget>Use `literal` here</Widget>\n\nKeep `<Token />`.'),
      'Keep `<Token />`.',
    );
    assert.equal(
      stripMdxForPlainText('> ~~~jsx\n> <Literal />\n\nOutside <Display /> prose.'),
      '> ~~~jsx\n> <Literal />\n\nOutside  prose.',
    );
    assert.equal(stripMdxForPlainText('Escaped \\`tick <Display />.'), 'Escaped \\`tick .');
  });

  it('preserves alternative fences, indentation, longer closers, and unclosed code', () => {
    for (const code of [
      '~~~jsx\n<Widget />\n~~~',
      '````md\n```jsx\n<Widget />\n```\n````',
      '  ~~~jsx\r\n  <Widget />\r\n  ~~~~  \r\n',
      '```jsx\n~~~\n<Widget />\n````',
      '~~~jsx\n<Widget />\n\n\n',
    ]) {
      assert.equal(stripMdxForPlainText(code), code);
      assert.equal(stripFrontmatterAndMdxForLlms(`---\ntitle: Code\n---\n\n${code}`), code);
    }
    assert.equal(stripMdxForPlainText(''), '');
    assert.equal(stripMdxForPlainText('```bad`info\n<Widget />'), '```bad`info');
  });

  it('normalizes prose spacing without changing multiline code literals', () => {
    const code = '```python\nvalue = """first\n\n\nlast"""\n```';
    assert.equal(stripMdxForPlainText(code), code);
    assert.equal(
      stripMdxForPlainText(`\nBefore\n\n\n${code}\n\n\nAfter\n`),
      `Before\n\n${code}\n\n\nAfter`,
    );
  });

  it('stripMdxForPlainText preserves prose between separated components', () => {
    const input = `
<FirstComponent prop="a" />

Important prose between components must survive.

<SecondComponent prop="b" />
`;
    const out = stripMdxForPlainText(input);
    assert.match(out, /Important prose between components must survive/);
    assert.doesNotMatch(out, /FirstComponent/);
    assert.doesNotMatch(out, /SecondComponent/);
  });

  it('stripMdxForPlainText removes imports, self-closing JSX, and paired component blocks', () => {
    const input = `
import Foo from '@site/x';

import {
  ExampleWidget,
} from '@site/src/components/ExampleWidget';

# Hello

<ExampleWidget />

<OtherComp prop="x" />

<ExampleWidget
  nodes={sampleTree}
  initialSelectedId="request-for-microproducts"
/>

Text after.

<ExampleWidget>
  nested
</ExampleWidget>

<ul>
  {authors.map((author) => (
    <li key={author.id}>{author.name}</li>
  ))}
</ul>

End.
`;
    const out = stripMdxForPlainText(input);
    assert.match(out, /# Hello/);
    assert.match(out, /Text after/);
    assert.match(out, /End/);
    assert.doesNotMatch(out, /import Foo/);
    assert.doesNotMatch(out, /ExampleWidget/);
    assert.doesNotMatch(out, /<OtherComp/);
    assert.doesNotMatch(out, /authors\.map/);
  });

  it('stripMdxForPlainText preserves plain HTML blocks without JSX expressions', () => {
    const input = `
# Title

<ul>
  <li>One</li>
  <li>Two</li>
</ul>
`;
    const out = stripMdxForPlainText(input);
    assert.match(out, /<ul>/);
    assert.match(out, /<li>One<\/li>/);
  });

  it('stripMdxForPlainText removes nested same-name JSX components', () => {
    const out = stripMdxForPlainText('<List><List>a</List></List>\nProse');
    assert.equal(out, 'Prose');
    assert.doesNotMatch(out, /<\/List>/);
  });

  it('stripMdxForPlainText preserves instructional import-shaped prose', () => {
    const out = stripMdxForPlainText("import values from 'config' carefully\nKeep");
    assert.match(out, /import values from 'config' carefully/);
    assert.match(out, /Keep/);
  });

  it('stripMdxForPlainText preserves fenced JSX-like tokens when the closer has trailing spaces', () => {
    const dirty = '# C\n\n```json\n{\n  "a": "<Foo />"\n}\n```  \n\nAfter';
    const clean = '# C\n\n```json\n{\n  "a": "<Foo />"\n}\n```\n\nAfter';
    assert.match(stripMdxForPlainText(dirty), /"a": "<Foo \/>"/);
    assert.match(stripMdxForPlainText(clean), /"a": "<Foo \/>"/);
  });

  it('stripMdxForPlainText preserves fenced code blocks containing braces', () => {
    const input = `
# Configure the build

\`\`\`json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
\`\`\`

Adjust the config to match your project.
`;
    const out = stripMdxForPlainText(input);
    assert.match(out, /"buildCommand": "npm run build"/);
    assert.match(out, /"outputDirectory": "dist"/);
    assert.match(out, /^\{$/m);
    assert.match(out, /^\}$/m);
    assert.match(out, /Adjust the config/);
  });

  it('stripFrontmatterAndMdxForLlms strips frontmatter then MDX', () => {
    const input = `---
title: T
---

import X from 'y';

Body <Foo /> tail.
`;
    const out = stripFrontmatterAndMdxForLlms(input);
    assert.match(out, /Body/);
    assert.match(out, /tail/);
    assert.doesNotMatch(out, /title:/);
    assert.doesNotMatch(out, /import X/);
    assert.doesNotMatch(out, /<Foo/);
  });

  it('stripYamlFrontmatter preserves plain text and malformed blocks', () => {
    assert.equal(stripYamlFrontmatter('Plain text'), 'Plain text');
    assert.equal(
      stripYamlFrontmatter('---\ntitle: Incomplete\nBody'),
      '---\ntitle: Incomplete\nBody',
    );
  });
});
