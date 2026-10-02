import fs from 'node:fs';
import path from 'node:path';

import {parseSourceFrontmatter, resolveHumanSourceFile} from './agentDocsUtils.mjs';
import {
  stripFrontmatterAndMdxForLlms,
  stripYamlFrontmatter,
} from './llmsMdxUtils.mjs';
import {flattenPlaybookNodes} from './playbookTreeUtils.mjs';

/**
 * @param {string} root repository root
 * @returns {[string, string, (text: string) => string][]}
 */
export function buildLlmsFullSources(root) {
  const sources = [
    ['static/AGENTS.md', 'Agent instructions', stripYamlFrontmatter],
    ['static/llms.txt', 'Discovery file', stripYamlFrontmatter],
    ['static/registry.json', 'Machine-readable registry', stripYamlFrontmatter],
    ['static/schemas/product.schema.json', 'Product schema', stripYamlFrontmatter],
    ['docs/templates/index.md', 'Templates overview', stripYamlFrontmatter],
    ['docs/agents/index.md', 'Agents hub', stripYamlFrontmatter],
    ['docs/archetypes/index.md', 'Archetypes overview', stripYamlFrontmatter],
    ['docs/contribute/how-to-contribute.md', 'Contribution workflow', stripYamlFrontmatter],
    ['docs/showcase/microproducts.md', 'Showcase summaries', stripYamlFrontmatter],
    ['docs/standards/folder-contract.md', 'Standard folder contract', stripYamlFrontmatter],
    ['docs/standards/maturity-model.md', 'Maturity model', stripYamlFrontmatter],
    ['docs/standards/what-counts-as-good.md', 'What counts as a good microproduct', stripYamlFrontmatter],
  ];

  const humanPlaybookTree = JSON.parse(
    fs.readFileSync(path.join(root, 'src', 'data', 'humanPlaybook.data.json'), 'utf8'),
  );
  const humanDocsRoot = path.join(root, 'docs', 'human');

  for (const node of flattenPlaybookNodes(humanPlaybookTree).filter((entry) => entry.docId)) {
    const sourcePath = resolveHumanSourceFile(humanDocsRoot, node.docId);
    const relativePath = path.relative(root, sourcePath).split(path.sep).join('/');
    const transform = sourcePath.endsWith('.mdx')
      ? stripFrontmatterAndMdxForLlms
      : stripYamlFrontmatter;
    const {title} = parseSourceFrontmatter(fs.readFileSync(sourcePath, 'utf8'));
    const label = typeof title === 'string' && title.trim() ? title : node.title ?? node.id;
    sources.push([relativePath, label, transform]);
  }

  const archetypeDir = path.join(root, 'docs', 'archetypes');
  const archetypeFiles = fs
    .readdirSync(archetypeDir)
    .filter((name) => name.endsWith('.md') && name !== 'index.md')
    .sort((a, b) => a.localeCompare(b, 'en'));

  for (const file of archetypeFiles) {
    const id = path.basename(file, '.md');
    const rel = path.join('docs', 'archetypes', file);
    sources.push([rel, `Archetype: ${id}`, stripYamlFrontmatter]);
  }

  sources.sort(([a], [b]) => a.localeCompare(b, 'en'));
  return sources.filter(([rel]) => {
    const metadata = parseSourceFrontmatter(fs.readFileSync(path.join(root, rel), 'utf8'));
    return metadata.draft !== true && metadata.unlisted !== true;
  });
}
