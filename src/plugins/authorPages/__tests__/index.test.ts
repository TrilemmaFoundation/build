import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {AllContent, LoadContext} from '@docusaurus/types';
import authorPagesPlugin from '../index';

function writeSite(authors: unknown): string {
  const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'author-pages-plugin-'));
  fs.mkdirSync(path.join(siteDir, 'src', 'data'), {recursive: true});
  fs.writeFileSync(
    path.join(siteDir, 'src', 'data', 'authors.json'),
    typeof authors === 'string' ? authors : JSON.stringify(authors),
    'utf8',
  );
  return siteDir;
}

function addRoutes(
  siteDir: string,
  allContent: AllContent = {},
  addRoute = jest.fn(),
) {
  const plugin = authorPagesPlugin({siteDir} as LoadContext);
  plugin.allContentLoaded?.({
    allContent,
    actions: {addRoute},
  } as never);
  return addRoute;
}

describe('authorPagesPlugin', () => {
  const siteDirs: string[] = [];

  afterEach(() => {
    for (const siteDir of siteDirs.splice(0)) {
      fs.rmSync(siteDir, {recursive: true, force: true});
    }
  });

  it('registers exact native routes and sanitizes registry bios and URLs', () => {
    const siteDir = writeSite([
      {
        id: 'safe',
        name: 'Safe Author',
        bio: 'Writes tests.',
        url: 'https://example.com/safe',
      },
      {id: 'blank-bio', name: 'Blank Bio', bio: '', url: 'javascript:alert(1)'},
      {id: 'http-only', name: 'HTTP Only', url: 'http://example.com'},
    ]);
    siteDirs.push(siteDir);

    const addRoute = addRoutes(siteDir, {
      'docusaurus-plugin-content-docs': {
        default: {
          loadedVersions: [
            {
              docs: [
                {
                  title: 'Safe Doc',
                  description: 'A published article.',
                  permalink: '/docs/safe-doc',
                  draft: false,
                  unlisted: false,
                  frontMatter: {authors: ['safe'], last_reviewed: '2026-08-25'},
                },
              ],
            },
          ],
        },
      },
    } as AllContent);

    expect(addRoute).toHaveBeenCalledTimes(3);
    expect(addRoute.mock.calls.map((call) => call[0].path)).toEqual([
      '/authors/safe',
      '/authors/blank-bio',
      '/authors/http-only',
    ]);
    expect(addRoute.mock.calls[0][0]).toMatchObject({
      component: '@site/src/components/AuthorPage',
      exact: true,
      props: {
        author: {
          id: 'safe',
          name: 'Safe Author',
          bio: 'Writes tests.',
          url: 'https://example.com/safe',
          articles: [
            {
              title: 'Safe Doc',
              description: 'A published article.',
              permalink: '/docs/safe-doc',
              lastReviewed: '2026-08-25',
            },
          ],
        },
      },
    });
    expect(addRoute.mock.calls[1][0].props.author).toEqual({
      id: 'blank-bio',
      name: 'Blank Bio',
      articles: [],
    });
    expect(addRoute.mock.calls[2][0].props.author).toEqual({
      id: 'http-only',
      name: 'HTTP Only',
      articles: [],
    });
  });

  it.each([
    {name: 'non-array root', records: {}},
    {name: 'primitive record', records: [1]},
    {name: 'null record', records: [null]},
    {name: 'missing ID', records: [{name: 'Author'}]},
    {name: 'numeric ID', records: [{id: 123, name: 'Author'}]},
    {name: 'route-unsafe ID', records: [{id: '../escape', name: 'Author'}]},
    {name: 'missing name', records: [{id: 'author'}]},
    {name: 'numeric name', records: [{id: 'author', name: 123}]},
    {name: 'blank name', records: [{id: 'author', name: ' \t '}]},
  ])('rejects a $name before registering any routes', ({records}) => {
    const siteDir = writeSite(
      Array.isArray(records) ? [{id: 'valid', name: 'Valid Author'}, ...records] : records,
    );
    siteDirs.push(siteDir);
    const addRoute = jest.fn();

    expect(() => addRoutes(siteDir, {}, addRoute)).toThrow(
      'Author registry must contain route-safe author records.',
    );
    expect(addRoute).not.toHaveBeenCalled();
  });

  it('omits absent and non-string optional profile fields', () => {
    const siteDir = writeSite([
      {id: 'absent', name: 'Absent Profile'},
      {id: 'non-string', name: 'Non-string Profile', bio: 123, url: 123},
    ]);
    siteDirs.push(siteDir);

    const addRoute = addRoutes(siteDir);
    expect(addRoute.mock.calls.map(([route]) => route.props.author)).toEqual([
      {id: 'absent', name: 'Absent Profile', articles: []},
      {id: 'non-string', name: 'Non-string Profile', articles: []},
    ]);
  });

  it('registers no routes for an empty registry', () => {
    const siteDir = writeSite([]);
    siteDirs.push(siteDir);

    expect(addRoutes(siteDir)).not.toHaveBeenCalled();
  });

  it('fails closed when the author registry is missing or invalid', () => {
    const missing = fs.mkdtempSync(path.join(os.tmpdir(), 'author-pages-missing-'));
    siteDirs.push(missing);
    expect(() => addRoutes(missing)).toThrow();

    const invalid = writeSite('not json');
    siteDirs.push(invalid);
    expect(() => addRoutes(invalid)).toThrow();
  });
});
