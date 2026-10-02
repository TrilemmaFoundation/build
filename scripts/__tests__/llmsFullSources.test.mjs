import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {describe, it} from 'node:test';

import {buildLlmsFullSources} from '../llmsFullSources.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('llmsFullSources', () => {
  it('omits draft and unlisted sources across human, archetype, and fixed doc sources', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'llms-visibility-'));
    try {
      for (const dir of ['docs', 'static', 'src/data']) {
        fs.cpSync(path.join(ROOT, dir), path.join(root, dir), {recursive: true});
      }
      const hidden = [
        ['docs/human/playbook/frame/frame.md', 'draft'],
        ['docs/archetypes/forecasting-product.md', 'unlisted'],
        ['docs/templates/index.md', 'draft'],
      ];
      for (const [rel, flag] of hidden) {
        const file = path.join(root, rel);
        fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^---\n/, `---\n${flag}: true\n`));
      }
      const sources = buildLlmsFullSources(root).map(([rel]) => rel);
      for (const [rel] of hidden) assert.ok(!sources.includes(rel), rel);
      assert.ok(sources.includes('docs/human/playbook/build/build.md'));
      assert.ok(sources.includes('static/registry.json'));
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });
  it('includes all playbook leaves from the tree', () => {
    const sources = buildLlmsFullSources(ROOT);
    const relPaths = sources.map(([rel]) => rel);

    assert.ok(relPaths.includes('docs/human/playbook/frame/frame.md'));
    assert.ok(relPaths.includes('docs/human/playbook/build/build.md'));
    assert.ok(relPaths.includes('docs/human/playbook/operate/operate.md'));
    assert.ok(relPaths.includes('docs/human/request-for-microproducts.md'));
    assert.ok(relPaths.includes('static/registry.json'));
    assert.ok(relPaths.includes('docs/archetypes/simulation-backtesting-product.md'));
  });

  it('preserves the complete Showcase catalog in the LLM source body', () => {
    const showcase = buildLlmsFullSources(ROOT).filter(([rel]) => rel === 'docs/showcase/microproducts.md');
    assert.equal(showcase.length, 1);
    const [rel, , transform] = showcase[0];
    const body = transform(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    for (const name of ['TitanSkies', 'HyperOptions', 'TravelCanary', 'HouseHunter', 'RockyRoad', 'StackingSats']) {
      assert.ok(body.includes(name), `missing ${name} from the Showcase LLM source`);
      assert.ok(body.includes(`https://data.trilemma.foundation/apps/${name.toLowerCase()}`));
    }
    assert.doesNotMatch(body, /OddsFox|HonestRoles|SurgRisk/);
  });

  it('uses canonical source titles for LLM headings without duplicated JSON titles', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'llms-titles-'));
    try {
      for (const dir of ['docs', 'static', 'src/data']) {
        fs.cpSync(path.join(ROOT, dir), path.join(root, dir), {recursive: true});
      }
      const cases = [
        {id: 'source-only', sourceTitle: 'Canonical source-only', expectedLabel: 'Canonical source-only'},
        {id: 'legacy-title', title: 'Stale JSON title', sidebarLabel: 'JSON navigation', sourceTitle: 'Canonical legacy-title', expectedLabel: 'Canonical legacy-title'},
        {id: 'missing-with-legacy', title: 'Missing-title fallback', expectedLabel: 'Missing-title fallback'},
        {id: 'non-string-title', title: 'Non-string-title fallback', sourceTitle: 123, expectedLabel: 'Non-string-title fallback'},
        {id: 'empty-title', title: 'Empty-title fallback', sourceTitle: '', expectedLabel: 'Empty-title fallback'},
        {id: 'blank-title', title: 'JSON fallback title', sourceTitle: '   ', expectedLabel: 'JSON fallback title'},
        {id: 'missing-title', expectedLabel: 'missing-title'},
      ];
      const nodes = cases.map(({id, title, sidebarLabel}) => ({
        id, ...(title ? {title} : {}), ...(sidebarLabel ? {sidebarLabel} : {}),
        docId: id, to: `/docs/${id}`, description: 'Tree description',
      }));
      fs.writeFileSync(path.join(root, 'src/data/humanPlaybook.data.json'), JSON.stringify(nodes));
      for (const entry of cases) {
        const title = entry.sourceTitle === undefined ? '' : `title: ${JSON.stringify(entry.sourceTitle)}\n`;
        fs.writeFileSync(path.join(root, `docs/human/${entry.id}.md`), `---\n${title}sidebar_label: Source navigation\n---\n\nSource body.`);
      }
      const sources = buildLlmsFullSources(root);
      for (const entry of cases) {
        const source = sources.find(([rel]) => rel === `docs/human/${entry.id}.md`);
        assert.ok(source, entry.id);
        assert.equal(source[1], entry.expectedLabel);
        assert.equal(source[2](fs.readFileSync(path.join(root, source[0]), 'utf8')).trim(), 'Source body.');
      }
    } finally {
      fs.rmSync(root, {recursive: true, force: true});
    }
  });

  it('sorts sources deterministically', () => {
    const first = buildLlmsFullSources(ROOT).map(([rel]) => rel);
    const second = buildLlmsFullSources(ROOT).map(([rel]) => rel);
    assert.deepEqual(first, second);
    assert.deepEqual([...first].sort((a, b) => a.localeCompare(b, 'en')), first);
  });
});
