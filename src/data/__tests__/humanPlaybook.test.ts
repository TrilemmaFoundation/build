import {
  buildAgentPlaybookSidebar,
  buildHumanPlaybookSidebar,
  humanPlaybookTree,
} from '../humanPlaybook';
import {flattenPlaybookNodes} from '../../utils/playbookTree';

describe('human playbook data', () => {
  it('generates the canonical sidebar hierarchy', () => {
    expect(buildHumanPlaybookSidebar()).toEqual([
      {
        type: 'category',
        label: 'About',
        collapsible: false,
        items: ['request-for-microproducts', 'authors'],
      },
      {
        type: 'category',
        label: 'Plan',
        collapsed: false,
        collapsible: false,
        items: [
          'playbook/frame/frame',
          'playbook/frame/data-licensing',
          'playbook/frame/modern-data-stack',
          'playbook/frame/quality-first',
        ],
      },
      {
        type: 'category',
        label: 'Build',
        collapsed: false,
        collapsible: false,
        items: ['playbook/build/build', 'playbook/build/from-chat-to-tickets', 'playbook/build/release'],
      },
      {
        type: 'category',
        label: 'Operate',
        collapsed: false,
        collapsible: false,
        items: ['playbook/operate/operate', 'playbook/operate/microproduct-deployment'],
      },
    ]);
  });

  it('generates the agent mirror sidebar hierarchy', () => {
    expect(buildAgentPlaybookSidebar()).toEqual([
      'index',
      'human/index',
      {
        type: 'category',
        label: 'About',
        collapsible: false,
        items: ['human/request-for-microproducts', 'human/authors'],
      },
      {
        type: 'category',
        label: 'Plan',
        collapsed: false,
        collapsible: false,
        items: [
          'human/playbook/frame/frame',
          'human/playbook/frame/data-licensing',
          'human/playbook/frame/modern-data-stack',
          'human/playbook/frame/quality-first',
        ],
      },
      {
        type: 'category',
        label: 'Build',
        collapsed: false,
        collapsible: false,
        items: ['human/playbook/build/build', 'human/playbook/build/from-chat-to-tickets', 'human/playbook/build/release'],
      },
      {
        type: 'category',
        label: 'Operate',
        collapsed: false,
        collapsible: false,
        items: ['human/playbook/operate/operate', 'human/playbook/operate/microproduct-deployment'],
      },
    ]);
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
