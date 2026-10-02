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
      items.flatMap((item) => typeof item === 'string' ? [item] : sidebarDocIds(item.items));
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
      {
        type: 'category',
        label: 'Leaf',
        collapsed: false,
        items: ['leaf'],
      },
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
      {
        type: 'category',
        label: 'Leaf',
        collapsed: false,
        items: ['human/leaf'],
      },
    ]);
  });
});
