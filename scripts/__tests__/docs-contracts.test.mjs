import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';
import {load} from 'js-yaml';

const ROOT = path.resolve(import.meta.dirname, '../..');

const FOLDER_CONTRACT_FILES = [
  'README.md',
  'AGENTS.md',
  'product.yaml',
  'product-brief.md',
  'architecture.md',
  'data-contract.md',
  'evaluation.md',
  'roadmap.md',
  'demo.md',
  'src/',
  'tests/',
];

const NO_STARTER_ARCHETYPES = new Set([
  'ranking-recommendation-engine',
  'risk-scoring-product',
  'alerting-monitoring-product',
  'search-discovery-product',
  'simulation-backtesting-product',
]);

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function archetypeSlugs() {
  return fs
    .readdirSync(path.join(ROOT, 'docs/archetypes'))
    .filter((name) => name.endsWith('.md') && name !== 'index.md')
    .map((name) => name.slice(0, -3))
    .sort();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function startersByArchetype() {
  const startersDir = path.join(ROOT, 'product-templates');
  /** @type {Map<string, string[]>} */
  const byArchetype = new Map();
  for (const entry of fs.readdirSync(startersDir, {withFileTypes: true})) {
    if (!entry.isDirectory()) {
      continue;
    }
    const yamlPath = path.join(startersDir, entry.name, 'product.yaml');
    const yaml = fs.readFileSync(yamlPath, 'utf8');
    const match = yaml.match(/^archetype:\s*(\S+)/m);
    assert.ok(match, `${entry.name} product.yaml must declare archetype`);
    const list = byArchetype.get(match[1]) ?? [];
    list.push(entry.name);
    byArchetype.set(match[1], list);
  }
  return byArchetype;
}

describe('documentation contracts', () => {
  it('provides required GitHub issue-form fields for every intake form', () => {
    const directory = path.join(ROOT, '.github/ISSUE_TEMPLATE');
    for (const file of fs.readdirSync(directory).filter((name) => name.endsWith('.yml'))) {
      const form = load(fs.readFileSync(path.join(directory, file), 'utf8'));
      assert.equal(typeof form.name, 'string', file);
      assert.equal(typeof form.description, 'string', file);
      assert.ok(form.description.trim().length > 0, file);
      assert.ok(Array.isArray(form.body) && form.body.length > 0, file);
    }
  });
  const catalog = read('docs/archetypes/index.md');
  const packageJson = JSON.parse(read('package.json'));

  it('lists the folder-contract files on every archetype page', () => {
    const slugs = archetypeSlugs();
    assert.ok(slugs.length >= 10, 'expected the published archetype catalog');
    for (const slug of slugs) {
      const body = read(`docs/archetypes/${slug}.md`);
      for (const file of FOLDER_CONTRACT_FILES) {
        assert.match(
          body,
          new RegExp(`\`${escapeRegExp(file)}\``),
          `${slug} must list ${file}`,
        );
      }
    }
  });

  it('either maps each archetype to a starter or marks it as having no starter', () => {
    const starters = startersByArchetype();
    for (const slug of archetypeSlugs()) {
      const starterNames = starters.get(slug) ?? [];
      const slugLink = `./${slug}.md`;
      const rows = catalog.split('\n').filter((line) => line.includes(slugLink));
      assert.equal(rows.length, 1, `catalog should have one row for ${slug}`);
      if (starterNames.length > 0) {
        assert.equal(
          NO_STARTER_ARCHETYPES.has(slug),
          false,
          `${slug} has a starter and must not be marked as having none`,
        );
        for (const name of starterNames) {
          assert.match(
            rows[0],
            new RegExp(`product-templates/${escapeRegExp(name)}`),
            `${slug} catalog row must link to starter ${name}`,
          );
        }
        continue;
      }
      assert.match(rows[0], /No starter yet/, `${slug} must say no starter yet`);
    }
  });

  it('generates llms-full.txt during npm run dev', () => {
    assert.match(packageJson.scripts.predev, /generate-llms-full\.mjs/);
  });

  it('points GitHub identity at TrilemmaFoundation/build', () => {
    const config = read('docusaurus.config.ts');
    assert.equal(packageJson.name, 'build');
    assert.match(config, /REPO_URL = 'https:\/\/github.com\/TrilemmaFoundation\/build'/);
    assert.match(config, /projectName: 'build'/);
    assert.doesNotMatch(catalog, /microproduct-lab/);
    assert.doesNotMatch(read('docs/templates/index.md'), /microproduct-lab/);
    assert.doesNotMatch(read('SECURITY.md'), /microproduct-lab/);
  });
});
