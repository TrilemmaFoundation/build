import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {describe, it} from 'node:test';

import {
  collectFrontmatterErrors,
  isValidReviewedDate,
} from '../validate-frontmatter.mjs';

const validMission = [
  'title: Mission',
  'description: Why this hub exists.',
  'last_reviewed: 2026-03-04',
  'authors: [trilemma-foundation]',
].join('\n');

function writeFile(root, filePath, content) {
  const fullPath = path.join(root, filePath);
  fs.mkdirSync(path.dirname(fullPath), {recursive: true});
  fs.writeFileSync(fullPath, content, 'utf8');
}

function frontmatter(body, newline = '\n') {
  return `---${newline}${body.replaceAll('\n', newline)}${newline}---${newline}${newline}Body${newline}`;
}

function setupFixture(mission = frontmatter(validMission)) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frontmatter-validator-'));
  writeFile(
    root,
    'src/data/authors.json',
    JSON.stringify([{id: 'trilemma-foundation', name: 'Trilemma Foundation'}]),
  );
  writeFile(root, 'docs/human/intro/mission.md', mission);
  writeFile(
    root,
    'docs/showcase/microproducts.md',
    `${frontmatter(validMission)}\n| Name | Description | Team | Link |\n`,
  );
  writeFile(root, 'templates/playbook-module.mdx', frontmatter(validMission));
  writeFile(root, 'product-templates/example/product.yaml', 'id: ignored\n');
  return root;
}

function validate(mission = frontmatter(validMission), mutate) {
  const root = setupFixture(mission);
  try {
    mutate?.(root);
    return collectFrontmatterErrors(root);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
}

function hasError(errors, text) {
  assert.ok(errors.some((error) => error.includes(text)), errors.join('\n'));
}

describe('frontmatter parsing and validation', () => {
  it('accepts full YAML, CRLF, optional tags, and valid leap days', () => {
    const body = [
      'title: "Mission: details"',
      'description: >-',
      '  A multiline description.',
      'tags:',
      '  - intro',
      '  - "mission, goals"',
      'last_reviewed: 2024-02-29',
      'authors: [trilemma-foundation]',
    ].join('\n');
    assert.deepEqual(validate(frontmatter(body, '\r\n')), []);
    assert.deepEqual(validate(), []);
  });

  it('rejects missing, non-mapping, malformed, and duplicate frontmatter', () => {
    hasError(validate('Body only\n'), 'missing frontmatter block');
    hasError(validate('---\n- item\n---\n'), 'frontmatter must be a YAML mapping');
    hasError(validate('---\ntitle: [\n---\n'), 'invalid YAML frontmatter');
    hasError(
      validate(frontmatter(`${validMission}\ntitle: Duplicate`)),
      'duplicated mapping key',
    );
  });

  it('validates list fields and known authors', () => {
    hasError(
      validate(frontmatter(`${validMission}\ntags: intro`)),
      'tags must be a YAML list of strings',
    );
    hasError(
      validate(frontmatter(`${validMission}\ntags: [intro, 123]`)),
      'tags must contain only string values',
    );
    hasError(
      validate(frontmatter(validMission.replace('authors: [trilemma-foundation]', 'authors: []'))),
      'authors must contain at least one author ID',
    );
    hasError(
      validate(frontmatter(validMission.replace('trilemma-foundation', 'unknown-author'))),
      "unknown author ID 'unknown-author'",
    );
    hasError(
      validate(frontmatter(validMission.replace('authors: [trilemma-foundation]', 'authors: owner'))),
      'authors must be a YAML list of strings',
    );
    hasError(
      validate(frontmatter(validMission.replace('authors: [trilemma-foundation]', 'authors: [123]'))),
      'authors must contain only string values',
    );
  });

  it('validates the optional description subtitle flag', () => {
    assert.deepEqual(
      validate(frontmatter(`${validMission}\nuseDescriptionAsSubtitle: true`)),
      [],
    );
    hasError(
      validate(frontmatter(`${validMission}\nuseDescriptionAsSubtitle: "true"`)),
      'useDescriptionAsSubtitle must be a boolean value',
    );
  });

  it('applies content-kind author rules', () => {
    const withoutAuthors = validMission.replace('\nauthors: [trilemma-foundation]', '');
    hasError(validate(frontmatter(withoutAuthors)), "missing required frontmatter field 'authors'");
    assert.deepEqual(
      validate(frontmatter(`${withoutAuthors}\ncontent_kind: foundation`)),
      [],
    );
    assert.deepEqual(
      validate(frontmatter(`${validMission}\ncontent_kind: reference`)),
      [],
    );
    hasError(
      validate(frontmatter(`${validMission}\ncontent_kind: blog`)),
      'content_kind must be one of foundation, module, reference, mirror',
    );
    hasError(
      validate(frontmatter(`${validMission}\ncontent_kind: 2`)),
      'content_kind must be a string value',
    );
  });

  it('requires complete metadata and real calendar dates', () => {
    hasError(validate(frontmatter('authors: [trilemma-foundation]')), "missing required frontmatter field 'title'");
    hasError(validate(frontmatter('title: Missing date\ndescription: Example\nauthors: [trilemma-foundation]')), 'missing last_reviewed value');
    hasError(
      validate(frontmatter(validMission.replace('2026-03-04', '2026-02-30'))),
      'expected valid YYYY-MM-DD',
    );
    assert.equal(isValidReviewedDate('2024-02-29'), true);
    assert.equal(isValidReviewedDate('2023-02-29'), false);
    assert.equal(isValidReviewedDate('not-a-date'), false);
    assert.equal(isValidReviewedDate(20260304), false);
  });

  it('reports missing or invalid author registries', () => {
    hasError(
      validate(undefined, (root) => fs.rmSync(path.join(root, 'src/data/authors.json'))),
      'author registry is missing',
    );
    hasError(
      validate(undefined, (root) => writeFile(root, 'src/data/authors.json', '{}')),
      'author registry must be an array',
    );
    hasError(
      validate(undefined, (root) => writeFile(root, 'src/data/authors.json', 'not json')),
      'invalid author registry',
    );
    hasError(
      validate(undefined, (root) => writeFile(root, 'src/data/authors.json', '[{}]')),
      'author id must be a lowercase kebab-case string',
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'src/data/authors.json',
          JSON.stringify([{id: 'Not Safe', name: 'Author'}]),
        ),
      ),
      'author id must be a lowercase kebab-case string',
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'src/data/authors.json',
          JSON.stringify([{id: 'author', name: ''}]),
        ),
      ),
      "author 'author' name must be a non-empty string value",
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'src/data/authors.json',
          JSON.stringify([{id: 'author', name: 'Author', bio: ''}]),
        ),
      ),
      "author 'author' bio must be a non-empty string value",
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'src/data/authors.json',
          JSON.stringify([{id: 'author', name: 'Author', bio: '   '}]),
        ),
      ),
      "author 'author' bio must be a non-empty string value",
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'src/data/authors.json',
          JSON.stringify([{id: 'author', name: 'Author', bio: 12}]),
        ),
      ),
      "author 'author' bio must be a non-empty string value",
    );
    assert.deepEqual(
      validate(undefined, (root) =>
        writeFile(
          root,
          'src/data/authors.json',
          JSON.stringify([
            {
              id: 'trilemma-foundation',
              name: 'Trilemma Foundation',
              bio: 'Maintains the playbook.',
            },
          ]),
        ),
      ),
      [],
    );
  });

  it('rejects unsafe author profile URLs', () => {
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'src/data/authors.json',
          JSON.stringify([
            {
              id: 'trilemma-foundation',
              name: 'Trilemma Foundation',
              url: 'javascript:alert(1)',
            },
          ]),
        ),
      ),
      "author 'trilemma-foundation' url must use HTTPS",
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'src/data/authors.json',
          JSON.stringify([
            {
              id: 'trilemma-foundation',
              name: 'Trilemma Foundation',
              url: 'http://example.com',
            },
          ]),
        ),
      ),
      "author 'trilemma-foundation' url must use HTTPS",
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'src/data/authors.json',
          JSON.stringify([
            {
              id: 'trilemma-foundation',
              name: 'Trilemma Foundation',
              url: 123,
            },
          ]),
        ),
      ),
      "author 'trilemma-foundation' url must be a string value",
    );
  });

  it('reports missing content roots and showcase contract drift', () => {
    hasError(
      validate(undefined, (root) => fs.rmSync(path.join(root, 'templates'), {recursive: true})),
      'templates directory does not exist',
    );
    hasError(
      validate(undefined, (root) => fs.rmSync(path.join(root, 'docs/showcase/microproducts.md'))),
      'docs/showcase/microproducts.md: file is missing',
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(root, 'docs/showcase/microproducts.md', frontmatter(validMission)),
      ),
      'table header must be exactly',
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'docs/showcase/microproducts.md',
          `${frontmatter(validMission)}\n| Name | Description | Team | Link | Extra |\n`,
        ),
      ),
      'table header must be exactly',
    );
    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'docs/showcase/microproducts.md',
          [
            frontmatter(validMission),
            '| Name | Description | Team | Link | Extra |',
            '| --- | --- | --- | --- | --- |',
            '| Broken | row | 1 | https://example.com | x |',
            '',
            'Example of the required header:',
            '| Name | Description | Team | Link |',
            '',
          ].join('\n'),
        ),
      ),
      'table header must be exactly',
    );
    assert.deepEqual(
      validate(undefined, (root) =>
        writeFile(
          root,
          'docs/showcase/microproducts.md',
          [
            frontmatter(validMission),
            '| --- | --- | --- | --- |',
            '| Name | Description | Team | Link |',
            '| --- | --- | --- | --- |',
            '',
          ].join('\n'),
        ),
      ),
      [],
    );
  });

  it('defaults to the repository root when no root argument is passed', () => {
    assert.deepEqual(collectFrontmatterErrors(), []);
  });

  it('resolves the repo root from the script location when cwd is scripts/', () => {
    const result = spawnSync(
      process.execPath,
      ['validate-frontmatter.mjs'],
      {
        cwd: path.resolve(import.meta.dirname, '..'),
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Frontmatter validation passed/);
  });

  it('validates generated mirror docs with mirror-specific rules', () => {
    const mirrorDoc = frontmatter(
      [
        'title: Mission',
        'description: Why this hub exists.',
        'slug: /playbook/frame',
        'canonical_human_url: /docs/playbook/frame',
        'section: frame',
        'source_doc_id: playbook/frame/frame',
        'content_kind: mirror',
      ].join('\n'),
    );
    assert.deepEqual(
      validate(undefined, (root) =>
        writeFile(root, 'docs/agents/human/playbook/frame/frame.md', mirrorDoc),
      ),
      [],
    );

    const overviewDoc = frontmatter(
      [
        'title: Human Docs Mirror',
        'description: Agent-first browsable mirror of the human playbook and supporting docs.',
        'slug: /human',
        'content_kind: mirror',
      ].join('\n'),
    );
    assert.deepEqual(
      validate(undefined, (root) => writeFile(root, 'docs/agents/human/index.md', overviewDoc)),
      [],
    );
  });

  it('rejects invalid generated mirror docs and mirror content_kind outside generated roots', () => {
    hasError(
      validate(undefined, (root) =>
        writeFile(root, 'docs/agents/human/playbook/frame/bad.md', 'No frontmatter here'),
      ),
      'docs/agents/human/playbook/frame/bad.md: missing frontmatter block',
    );

    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'docs/agents/human/bad.md',
          frontmatter(
            ['title: Bad Mirror', 'description: Missing content kind.'].join('\n'),
          ),
        ),
      ),
      "missing required frontmatter field 'content_kind'",
    );

    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'docs/agents/human/missing-title.md',
          frontmatter(['description: Missing title field.', 'content_kind: mirror'].join('\n')),
        ),
      ),
      "missing required frontmatter field 'title'",
    );

    hasError(
      validate(
        frontmatter(
          [
            'title: Illegal Mirror',
            'description: Mirror outside generated tree.',
            'content_kind: mirror',
            'last_reviewed: 2026-03-04',
          ].join('\n'),
        ),
      ),
      'content_kind mirror is reserved for generated docs',
    );

    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'docs/agents/human/wrong-kind.md',
          frontmatter(
            [
              'title: Wrong kind',
              'description: Not a mirror doc.',
              'content_kind: module',
            ].join('\n'),
          ),
        ),
      ),
      'generated mirror docs must use content_kind: mirror',
    );

    hasError(
      validate(undefined, (root) =>
        writeFile(
          root,
          'docs/agents/human/invalid-field.md',
          frontmatter(
            [
              'title: Invalid field',
              'description: Bad canonical URL type.',
              'content_kind: mirror',
              'canonical_human_url: 123',
            ].join('\n'),
          ),
        ),
      ),
      'canonical_human_url must be a string value',
    );
  });

});
