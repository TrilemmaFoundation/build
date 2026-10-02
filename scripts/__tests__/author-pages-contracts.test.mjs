import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '../..');

describe('native author page contracts', () => {
  const catalog = fs.readFileSync(path.join(ROOT, 'docs/human/authors.mdx'), 'utf8');
  const config = fs.readFileSync(path.join(ROOT, 'docusaurus.config.ts'), 'utf8');
  const authors = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/data/authors.json'), 'utf8'),
  );

  it('keeps the author catalog on the docs island and links to native profiles', () => {
    assert.match(config, /authorPagesPlugin/);
    assert.match(catalog, /^slug: \/authors$/m);
    assert.ok(Array.isArray(authors) && authors.length > 0);
    assert.equal(
      authors.every((author) => typeof author?.id === 'string' && author.id.length > 0),
      true,
    );
  });
});
