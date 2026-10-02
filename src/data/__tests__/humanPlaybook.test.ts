import {
  buildAgentPlaybookSidebar,
  buildHumanPlaybookSidebar,
  humanPlaybookTree,
} from '../humanPlaybook';
import type {GeneratedSidebarItem, PlaybookTreeNode} from '../humanPlaybook';
import {flattenPlaybookNodes} from '../../utils/playbookTree';

describe('human playbook data', () => {
  const fixture: PlaybookTreeNode = {
    id: 'root', title: 'Root', description: 'Root', docId: 'root',
    children: [
      {id: 'about', title: 'About document', description: 'About', docId: 'about'},
      {
        id: 'playbook', title: 'Playbook', description: 'Playbook',
        children: [
          {
            id: 'plan', title: 'Plan', description: 'Plan',
            children: [
              {id: 'intro', title: 'Intro', description: 'Intro', docId: 'plan/intro'},
              {
                id: 'nested', title: 'Nested', description: 'Nested',
                children: [
                  {id: 'detail', title: 'Detail', description: 'Detail', docId: 'plan/detail'},
                ],
              },
            ],
          },
          {
            id: 'build', title: 'Build', description: 'Build',
            children: [
              {id: 'release', title: 'Release', description: 'Release', docId: 'build/release'},
            ],
          },
        ],
      },
    ],
  };

  it.each([
    {name: 'human', buildSidebar: buildHumanPlaybookSidebar, prefix: '', leading: []},
    {name: 'agent', buildSidebar: buildAgentPlaybookSidebar, prefix: 'human/', leading: ['index', 'human/index']},
  ])('generates the $name sidebar hierarchy from a fixture', ({buildSidebar, prefix, leading}) => {
    expect(buildSidebar(fixture)).toEqual([
      ...leading,
      {
        type: 'category', label: 'About', collapsible: false,
        items: [`${prefix}root`, `${prefix}about`],
      },
      {
        type: 'category', label: 'Plan', collapsed: false, collapsible: false,
        items: [
          `${prefix}plan/intro`,
          {
            type: 'category', label: 'Nested', collapsed: false, collapsible: undefined,
            items: [`${prefix}plan/detail`],
          },
        ],
      },
      {
        type: 'category', label: 'Build', collapsed: false, collapsible: false,
        items: [`${prefix}build/release`],
      },
    ]);
  });

  it('includes every live document exactly once in each sidebar', () => {
    const sidebarDocIds = (items: GeneratedSidebarItem[]): string[] =>
      items.flatMap((item) =>
        typeof item === 'string' ? [item]
          : item.type === 'doc' ? [item.id] : sidebarDocIds(item.items),
      );
    const docIds = flattenPlaybookNodes(humanPlaybookTree)
      .flatMap((node) => node.docId ? [node.docId] : []);

    expect(sidebarDocIds(buildHumanPlaybookSidebar()).sort()).toEqual([...docIds].sort());
    expect(sidebarDocIds(buildAgentPlaybookSidebar()).sort()).toEqual(
      ['index', 'human/index', ...docIds.map((id) => `human/${id}`)].sort(),
    );
  });

  it('keeps node IDs, document IDs, and routes unique', () => {
    const nodes = flattenPlaybookNodes(humanPlaybookTree);
    for (const field of ['id', 'docId', 'to'] as const) {
      const values = nodes.map((node) => node[field]).filter(Boolean);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('rejects roots and leaves without document IDs', () => {
    expect(() =>
      buildHumanPlaybookSidebar({
        id: 'root',
        title: 'Root',
        description: 'Missing document',
      }),
    ).toThrow('Playbook root is missing docId');
    expect(() =>
      buildHumanPlaybookSidebar({
        id: 'root',
        title: 'Root',
        description: 'Root',
        docId: 'root',
        children: [{id: 'leaf', title: 'Leaf', description: 'Missing document'}],
      }),
    ).toThrow("Playbook leaf 'leaf' is missing docId");
    expect(() =>
      buildAgentPlaybookSidebar({
        id: 'root',
        title: 'Root',
        description: 'Missing document',
      }),
    ).toThrow('Playbook root is missing docId');
  });

  it('generates a root-only sidebar', () => {
    expect(
      buildHumanPlaybookSidebar({
        id: 'root',
        title: 'Root',
        description: 'Root document',
        docId: 'root',
      }),
    ).toEqual(['root']);
  });

  it('uses an explicit JSON sidebar label when provided', () => {
    const root = {
      id: 'root',
      title: 'Page title',
      sidebarLabel: 'JSON sidebar label',
      description: 'Root document',
      docId: 'root',
    };

    expect(buildHumanPlaybookSidebar(root)).toEqual([
      {type: 'doc', id: 'root', label: 'JSON sidebar label'},
    ]);
    expect(buildAgentPlaybookSidebar(root)).toEqual([
      'index',
      'human/index',
      {type: 'doc', id: 'human/root', label: 'JSON sidebar label'},
    ]);
  });

  it('allows a root document without a duplicated JSON title', () => {
    expect(buildHumanPlaybookSidebar({id: 'root', description: 'Root', docId: 'root'}))
      .toEqual(['root']);
  });

  it('requires titles for categories with child documents', () => {
    const root: PlaybookTreeNode = {
      id: 'root', description: 'Root', docId: 'root',
      children: [{
        id: 'group', description: 'Missing category title',
        children: [{id: 'leaf', description: 'Leaf', docId: 'leaf'}],
      }],
    };
    expect(() => buildHumanPlaybookSidebar(root)).toThrow("Playbook category 'group' is missing title");
    expect(() => buildAgentPlaybookSidebar(root)).toThrow("Playbook category 'group' is missing title");
  });

  it('requires a title on the structural playbook category', () => {
    const root: PlaybookTreeNode = {
      id: 'root', description: 'Root', docId: 'root',
      children: [{
        id: 'playbook', description: 'Missing structural category title',
        children: [{
          id: 'plan', title: 'Plan', description: 'Plan',
          children: [{id: 'leaf', description: 'Leaf', docId: 'leaf'}],
        }],
      }],
    };
    expect(() => buildHumanPlaybookSidebar(root)).toThrow("Playbook category 'playbook' is missing title");
    expect(() => buildAgentPlaybookSidebar(root)).toThrow("Playbook category 'playbook' is missing title");
  });

  it.each([
    {name: 'human', buildSidebar: buildHumanPlaybookSidebar, prefix: '', leading: []},
    {name: 'agent', buildSidebar: buildAgentPlaybookSidebar, prefix: 'human/', leading: ['index', 'human/index']},
  ])('keeps root and nested JSON sidebar overrides in the $name sidebar', ({buildSidebar, prefix, leading}) => {
    const root: PlaybookTreeNode = {
      id: 'root', description: 'Root', docId: 'root', sidebarLabel: 'Root navigation',
      children: [{
        id: 'playbook', title: 'Playbook', description: 'Playbook',
        children: [{
          id: 'plan', title: 'Plan', description: 'Plan',
          children: [{id: 'leaf', description: 'Leaf', docId: 'leaf', sidebarLabel: 'Leaf navigation'}],
        }],
      }],
    };
    expect(buildSidebar(root)).toEqual([
      ...leading,
      {type: 'category', label: 'About', collapsible: false, items: [{type: 'doc', id: `${prefix}root`, label: 'Root navigation'}]},
      {type: 'category', label: 'Plan', collapsed: false, collapsible: false, items: [{type: 'doc', id: `${prefix}leaf`, label: 'Leaf navigation'}]},
    ]);
  });

  it.each([
    {name: 'omitted children', children: undefined},
    {name: 'empty children', children: []},
  ])('keeps untitled leaf documents outside categories without playbook sections ($name)', ({children}) => {
    const root: PlaybookTreeNode = {
      id: 'root', description: 'Root', docId: 'root',
      children: [{id: 'leaf', description: 'Leaf', docId: 'leaf', children}],
    };
    expect(buildHumanPlaybookSidebar(root)).toEqual(['root', 'leaf']);
    expect(buildAgentPlaybookSidebar(root)).toEqual(['index', 'human/index', 'human/root', 'human/leaf']);
  });

  it('rejects an empty structural container without a document ID', () => {
    const root: PlaybookTreeNode = {
      id: 'root', description: 'Root', docId: 'root',
      children: [{id: 'playbook', title: 'Playbook', description: 'Empty playbook', children: []}],
    };
    expect(() => buildHumanPlaybookSidebar(root)).toThrow("Playbook leaf 'playbook' is missing docId");
    expect(() => buildAgentPlaybookSidebar(root)).toThrow("Playbook leaf 'playbook' is missing docId");
  });

  it('falls back to grouped categories when playbook sections are absent', () => {
    const root = {
      id: 'root',
      title: 'Root',
      description: 'Root document',
      docId: 'root',
      children: [
        {
          id: 'grouped',
          title: 'Grouped',
          description: 'A section with nested leaves',
          children: [
            {
              id: 'nested',
              title: 'Nested',
              description: 'Nested leaf',
              docId: 'nested',
            },
          ],
        },
        {
          id: 'leaf',
          title: 'Leaf',
          description: 'A leaf without children',
          docId: 'leaf',
        },
      ],
    };

    expect(buildHumanPlaybookSidebar(root)).toEqual([
      'root',
      {
        type: 'category',
        label: 'Grouped',
        collapsed: false,
        items: ['nested'],
      },
      'leaf',
    ]);

    expect(buildAgentPlaybookSidebar(root)).toEqual([
      'index',
      'human/index',
      'human/root',
      {
        type: 'category',
        label: 'Grouped',
        collapsed: false,
        items: ['human/nested'],
      },
      'human/leaf',
    ]);
  });
});
