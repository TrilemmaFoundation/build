import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterEach, describe, it} from 'node:test';
import {toSidebarDocItemLinkProp} from '@docusaurus/plugin-content-docs/lib/props.js';

import {
  agentSlugFromHumanTo,
  assertPathInside,
  buildAgentMirrorDocument,
  metadataFromNode,
  parseSourceFrontmatter,
  renderAgentMirrorOverview,
  resolveHumanSourceFile,
  sectionFromDocId,
} from '../agentDocsUtils.mjs';
import {generateAgentDocs} from '../generate-agent-docs.mjs';
import {stripFrontmatterAndMdxForLlms} from '../llmsMdxUtils.mjs';
import {flattenPlaybookNodes} from '../playbookTreeUtils.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const humanPlaybookTree = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src', 'data', 'humanPlaybook.data.json'), 'utf8'),
);

function writeFile(root, filePath, content) {
  const fullPath = path.join(root, filePath);
  fs.mkdirSync(path.dirname(fullPath), {recursive: true});
  fs.writeFileSync(fullPath, content, 'utf8');
}

describe('agentDocsUtils', () => {
  it('derives sections and agent slugs from human routes', () => {
    assert.equal(sectionFromDocId('playbook/frame/frame'), 'frame');
    assert.equal(sectionFromDocId('playbook/build/build'), 'build');
    assert.equal(sectionFromDocId('playbook/operate/operate'), 'operate');
    assert.equal(sectionFromDocId('playbook/grow/scale'), 'grow');
    assert.equal(sectionFromDocId('authors'), 'authors');
    assert.equal(sectionFromDocId('request-for-microproducts'), 'overview');
    assert.equal(sectionFromDocId('unknown/path'), 'other');
    assert.equal(agentSlugFromHumanTo('/docs/playbook/frame'), '/playbook/frame');
    assert.equal(agentSlugFromHumanTo('/docs'), '/');
    assert.throws(() => agentSlugFromHumanTo('/agents/foo'), /Expected human route/);
  });

  it('flattens the playbook tree and resolves human source files', () => {
    const leaves = flattenPlaybookNodes(humanPlaybookTree).filter((node) => node.docId);
    assert.ok(leaves.length >= 5);
    const humanDocsRoot = path.join(ROOT, 'docs', 'human');
    const sourcePath = resolveHumanSourceFile(
      humanDocsRoot,
      'playbook/frame/frame',
    );
    assert.match(sourcePath, /frame\.md$/);
    assert.throws(
      () => resolveHumanSourceFile(humanDocsRoot, 'missing/doc'),
      /Source not found/,
    );
    assert.throws(
      () => resolveHumanSourceFile(humanDocsRoot, '../outside'),
      /Path escapes root/,
    );
    assert.equal(
      assertPathInside(humanDocsRoot, humanDocsRoot),
      path.resolve(humanDocsRoot),
    );
    assert.equal(
      assertPathInside(humanDocsRoot, path.join(humanDocsRoot, 'playbook')),
      path.resolve(humanDocsRoot, 'playbook'),
    );
    assert.throws(
      () => assertPathInside(humanDocsRoot, path.join(humanDocsRoot, '..', 'secrets')),
      /Path escapes root/,
    );
  });

  it('builds mirror metadata and documents with stripped MDX', () => {
    const sourceText = `---
title: Source Title
sidebar_label: Source sidebar label
description: Source description
slug: /playbook/example
---

import Foo from 'bar';

# Heading

<ExampleWidget />

Body text.
`;
    const node = {
      id: 'example',
      title: 'Fallback Title',
      description: 'Fallback description',
      docId: 'playbook/frame/example',
      to: '/docs/playbook/example',
    };

    const metadata = metadataFromNode(sourceText, node);
    assert.deepEqual(metadata, {
      title: 'Source Title',
      sidebarLabel: 'Source sidebar label',
      description: 'Source description',
      slug: '/playbook/example',
      canonicalHumanUrl: '/docs/playbook/example',
      section: 'frame',
      sourceDocId: 'playbook/frame/example',
    });

    const output = buildAgentMirrorDocument(sourceText, metadata);
    assert.match(output, /^---\n/);
    assert.match(output, /content_kind: mirror/);
    assert.match(output, /sidebar_label: Source sidebar label/);
    assert.match(output, /canonical_human_url: \/docs\/playbook\/example/);
    assert.match(output, /Agent-first mirror/);
    assert.match(output, /# Heading/);
    assert.match(output, /Body text/);
    assert.doesNotMatch(output, /import Foo/);
    assert.doesNotMatch(output, /<ExampleWidget/);
  });

  it('falls back to tree metadata when frontmatter is missing', () => {
    const node = {
      id: 'frame',
      title: 'Frame',
      description: 'Frame description',
      docId: 'playbook/frame/frame',
      to: '/docs/playbook/frame',
    };
    const metadata = metadataFromNode('Plain body without frontmatter', node);
    assert.equal(metadata.title, 'Frame');
    assert.equal(metadata.slug, '/playbook/frame');
    assert.throws(
      () => metadataFromNode('Body', {id: 'bad', title: 'Bad', description: 'Bad'}),
      /missing docId or to/,
    );
  });

  it('falls back when frontmatter fields are not strings', () => {
    const node = {
      id: 'frame',
      title: 'Frame',
      description: 'Frame description',
      docId: 'playbook/frame/frame',
      to: '/docs/playbook/frame',
    };
    const sourceText = `---
title: 123
description: false
slug: 99
---

Body
`;
    const metadata = metadataFromNode(sourceText, node);
    assert.equal(metadata.title, 'Frame');
    assert.equal(metadata.description, 'Frame description');
    assert.equal(metadata.slug, '/playbook/frame');
  });

  it('falls back to a JSON sidebar label or node ID when no title is available', () => {
    const node = {id: 'fallback', description: 'Fallback', docId: 'fallback', to: '/docs/fallback'};
    assert.equal(metadataFromNode('Body', {...node, sidebarLabel: 'JSON navigation'}).title, 'JSON navigation');
    assert.equal(metadataFromNode('Body', node).title, 'fallback');
  });

  it('keeps deterministic overview fallbacks when document metadata is unavailable', () => {
    const nodes = [
      {id: 'json-label', sidebarLabel: 'JSON navigation'},
      {id: 'json-title', title: 'JSON fallback title'},
      {id: 'id-only'},
    ].map((node) => ({...node, description: 'Fallback', docId: node.id, to: `/docs/${node.id}`}));
    const overview = renderAgentMirrorOverview(nodes);
    assert.match(overview, /\[JSON navigation\]\(\/agents\/json-label\)/);
    assert.match(overview, /\[JSON fallback title\]\(\/agents\/json-title\)/);
    assert.match(overview, /\[id-only\]\(\/agents\/id-only\)/);
    const categoryOverview = renderAgentMirrorOverview([{
      id: 'category', title: 'JSON category heading', sidebarLabel: 'Document-only override',
      description: 'Category', children: nodes,
    }]);
    assert.match(categoryOverview, /^### JSON category heading$/m);
    assert.doesNotMatch(categoryOverview, /Document-only override/);
    assert.match(
      renderAgentMirrorOverview([{id: 'category', description: 'Category', children: nodes}]),
      /^### category$/m,
    );
  });

  it('parses malformed frontmatter safely and renders overview links', () => {
    assert.deepEqual(parseSourceFrontmatter('no frontmatter'), {});
    assert.deepEqual(parseSourceFrontmatter('---\n- not\na map\n---\n'), {});
    assert.deepEqual(parseSourceFrontmatter('---\n- one\n- two\n---\n'), {});
    assert.deepEqual(parseSourceFrontmatter('---\nnull\n---\n'), {});
    assert.deepEqual(parseSourceFrontmatter('---\n42\n---\n'), {});
    const overview = renderAgentMirrorOverview(humanPlaybookTree);
    assert.match(overview, /Human Docs Mirror/);
    assert.match(overview, /\/agents\/playbook\/frame/);
    assert.match(overview, /\/agents\/request-for-microproducts/);
    assert.match(overview, /### Playbook/);
    const customOverview = renderAgentMirrorOverview([
      {
        id: 'root',
        title: 'Root',
        description: 'Root description',
        docId: 'request-for-microproducts',
        to: '/docs/request-for-microproducts',
        children: [
          {
            id: 'section',
            title: 'Section',
            description: 'Section description',
            children: [
              {
                id: 'leaf',
                title: 'Leaf',
                description: 'Leaf description',
                docId: 'playbook/frame/sample',
                to: '/docs/playbook/sample',
              },
            ],
          },
        ],
      },
    ]);
    assert.match(customOverview, /\/agents\/request-for-microproducts/);
    assert.match(customOverview, /  - \[Leaf\]/);
  });

  it('strips mirror source text through the shared llms helper', () => {
    const input = `---
title: T
---

import X from 'y';

Body <Foo /> tail.
`;
    const out = stripFrontmatterAndMdxForLlms(input);
    assert.match(out, /Body/);
    assert.match(out, /tail/);
    assert.doesNotMatch(out, /import X/);
    assert.doesNotMatch(out, /<Foo/);
  });
});

describe('generateAgentDocs', () => {
  let tempRoot;

  afterEach(() => {
    if (tempRoot) {
      fs.rmSync(tempRoot, {recursive: true, force: true});
      tempRoot = undefined;
    }
  });

  it('preserves visibility on mirrors but omits hidden overview links, including nested nodes', () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-visibility-'));
    const node = (id, children = []) => ({
      id, docId: id, to: `/docs/${id}`, title: id, description: id, children,
    });
    const tree = [node('draft', [node('unlisted', [node('public')])])];
    writeFile(tempRoot, 'src/data/humanPlaybook.data.json', JSON.stringify(tree));
    for (const [id, flags] of [
      ['draft', 'draft: true'], ['unlisted', 'unlisted: true'],
      ['public', 'draft: false\nunlisted: false'],
    ]) {
      writeFile(tempRoot, `docs/human/${id}.md`, `---\ntitle: ${id}\n${flags}\n---\n\nBody`);
    }
    const {mirrorRoot} = generateAgentDocs({root: tempRoot});
    const read = (id) => fs.readFileSync(path.join(mirrorRoot, `${id}.md`), 'utf8');
    assert.equal(parseSourceFrontmatter(read('draft')).draft, true);
    assert.equal(parseSourceFrontmatter(read('unlisted')).unlisted, true);
    assert.equal(parseSourceFrontmatter(read('public')).draft, undefined);
    assert.doesNotMatch(read('index'), /\/agents\/(draft|unlisted)/);
    assert.match(read('index'), /^- \[public\]\(\/agents\/public\)/m);
  });

  it('generates mirror docs, overview index, and removes stale output', () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-docs-'));
    writeFile(
      tempRoot,
      'src/data/humanPlaybook.data.json',
      JSON.stringify([
        {
          id: 'sample',
          title: 'Sample',
          description: 'Sample description',
          docId: 'playbook/frame/sample',
          to: '/docs/playbook/sample',
          children: [
            {
              id: 'another',
              description: 'Another description',
              docId: 'playbook/frame/another',
              to: '/docs/playbook/another',
            },
          ],
        },
      ]),
    );
    writeFile(
      tempRoot,
      'docs/human/playbook/frame/sample.md',
      `---
title: Sample
description: Sample description
slug: /playbook/sample
---

# Sample body
`,
    );
    writeFile(
      tempRoot,
      'docs/human/playbook/frame/another.md',
      `---
title: Another
sidebar_label: Another sidebar label
description: Another description
slug: /playbook/another
---

# Another body
`,
    );
    writeFile(tempRoot, 'docs/agents/human/stale.md', '# stale mirror output\n');

    const {written, mirrorRoot} = generateAgentDocs({root: tempRoot});
    assert.deepEqual(written, ['playbook/frame/another', 'playbook/frame/sample']);
    assert.equal(mirrorRoot, path.join(tempRoot, 'docs', 'agents', 'human'));
    assert.equal(fs.existsSync(path.join(mirrorRoot, 'stale.md')), false);

    const sample = fs.readFileSync(
      path.join(mirrorRoot, 'playbook', 'frame', 'sample.md'),
      'utf8',
    );
    assert.match(sample, /source_doc_id: playbook\/frame\/sample/);
    assert.match(sample, /# Sample body/);

    const overview = fs.readFileSync(path.join(mirrorRoot, 'index.md'), 'utf8');
    assert.match(overview, /Human Docs Mirror/);
    assert.match(overview, /\/agents\/playbook\/sample/);
    assert.match(overview, /\[Another sidebar label\]/);
  });

  it('keeps source titles and Docusaurus label precedence in mirrors and their overview', () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-labels-'));
    const cases = [
      {id: 'source-label', title: 'Stale JSON title', sidebarLabel: 'JSON navigation', sourceLabel: 'Source navigation', expectedLabel: 'Source navigation'},
      {id: 'json-label', sidebarLabel: 'JSON navigation', expectedLabel: 'JSON navigation'},
      {id: 'document-title', expectedLabel: 'Canonical document-title'},
    ];
    const nodes = cases.map(({id, title, sidebarLabel}) => ({
      id, ...(title ? {title} : {}), ...(sidebarLabel ? {sidebarLabel} : {}),
      description: 'Tree description', docId: id, to: `/docs/${id}`,
    }));
    writeFile(tempRoot, 'src/data/humanPlaybook.data.json', JSON.stringify(nodes));
    for (const entry of cases) {
      writeFile(tempRoot, `docs/human/${entry.id}.md`, [
        '---', `title: Canonical ${entry.id}`, 'description: Source description',
        ...(entry.sourceLabel ? [`sidebar_label: ${entry.sourceLabel}`] : []),
        'useDescriptionAsSubtitle: true', '---', '', 'Source body.',
      ].join('\n'));
    }
    const {mirrorRoot} = generateAgentDocs({root: tempRoot});
    const overview = fs.readFileSync(path.join(mirrorRoot, 'index.md'), 'utf8');
    for (const [index, entry] of cases.entries()) {
      const node = nodes[index];
      const source = parseSourceFrontmatter(fs.readFileSync(path.join(tempRoot, `docs/human/${entry.id}.md`), 'utf8'));
      const mirror = parseSourceFrontmatter(fs.readFileSync(path.join(mirrorRoot, `${entry.id}.md`), 'utf8'));
      const item = {type: 'doc', id: entry.id, label: node.sidebarLabel};
      const humanLink = toSidebarDocItemLinkProp({item, doc: {id: entry.id, title: source.title, permalink: node.to, frontMatter: source, unlisted: false}});
      const mirrorLink = toSidebarDocItemLinkProp({item, doc: {id: entry.id, title: mirror.title, permalink: `/agents/${entry.id}`, frontMatter: mirror, unlisted: false}});
      assert.equal(mirror.title, source.title);
      assert.equal(mirror.useDescriptionAsSubtitle, undefined);
      assert.equal(humanLink.label, entry.expectedLabel);
      assert.equal(mirrorLink.label, humanLink.label);
      assert.ok(overview.includes(`[${humanLink.label}](/agents/${entry.id})`), overview);
      assert.doesNotMatch(overview, /undefined|Stale JSON title/);
    }
  });

  it('rejects docIds that escape the agent mirror root', () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-docs-escape-'));
    writeFile(
      tempRoot,
      'src/data/humanPlaybook.data.json',
      JSON.stringify([
        {
          id: 'escape',
          title: 'Escape',
          description: 'Escape description',
          docId: '../escape',
          to: '/docs/escape',
        },
      ]),
    );
    writeFile(
      tempRoot,
      'docs/human/escape.md',
      `---
title: Escape
description: Escape description
slug: /escape
---

# Escape body
`,
    );

    assert.throws(() => generateAgentDocs({root: tempRoot}), /Path escapes root/);
    assert.equal(
      fs.existsSync(path.join(tempRoot, 'docs', 'agents', 'escape.md')),
      false,
    );
  });
});
