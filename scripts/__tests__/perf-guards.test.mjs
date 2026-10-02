import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '../..');

const FORBIDDEN_MERMAID_DEPS = [
  '@docusaurus/theme-mermaid',
  '@mermaid-js/layout-elk',
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

describe('performance guards', () => {
  const packageJson = JSON.parse(read('package.json'));
  const docusaurusConfig = read('docusaurus.config.ts');
  const ciWorkflow = read('.github/workflows/ci.yml');

  it('omits unused mermaid and ELK dependencies', () => {
    const declared = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    for (const name of FORBIDDEN_MERMAID_DEPS) {
      assert.equal(
        Object.hasOwn(declared, name),
        false,
        `unexpected dependency '${name}'`,
      );
    }
  });

  it('does not enable mermaid in the Docusaurus config', () => {
    assert.doesNotMatch(docusaurusConfig, /theme-mermaid/);
    assert.doesNotMatch(docusaurusConfig, /markdown\.mermaid/);
    assert.doesNotMatch(docusaurusConfig, /^\s*mermaid\s*:/m);
  });

  it('does not index archetype pages in local search', () => {
    assert.match(docusaurusConfig, /searchIgnoreFiles\(humanPlaybookTree\)/);
    assert.match(docusaurusConfig, /routeBasePath:\s*'archetypes'/);
  });

  it('keeps local check scripts including validators, tests, and build', () => {
    assert.equal(packageJson.scripts['check:fast'], 'npm run check:validate && npm test');
    assert.equal(
      packageJson.scripts.check,
      'npm run check:validate && npm run test:coverage && npm run build',
    );
    assert.equal(
      packageJson.scripts['check:ci'],
      'npm run check:validate && npm run build',
    );
  });

  it('runs validators and build once, then coverage tests, in CI', () => {
    assert.match(ciWorkflow, /^\s+run:\s+npm run check:ci\s*$/m);
    assert.match(ciWorkflow, /^\s+run:\s+npm run test:coverage\s*$/m);
    assert.doesNotMatch(ciWorkflow, /^\s+run:\s+npm run check\s*$/m);
    assert.doesNotMatch(ciWorkflow, /^\s+run:\s+npm test\s*$/m);
  });
});
