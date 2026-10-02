#!/usr/bin/env node
/**
 * Generates agent-first mirror docs under docs/agents/human/ from docs/human sources.
 */

import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

import {
  assertPathInside,
  buildAgentMirrorDocument,
  metadataFromNode,
  renderAgentMirrorOverview,
  resolveHumanSourceFile,
} from './agentDocsUtils.mjs';
import {flattenPlaybookNodes} from './playbookTreeUtils.mjs';

/**
 * @param {{ root?: string }} [options]
 */
export function generateAgentDocs({root = path.resolve(import.meta.dirname, '..')} = {}) {
  const humanPlaybookTree = JSON.parse(
    fs.readFileSync(path.join(root, 'src', 'data', 'humanPlaybook.data.json'), 'utf8'),
  );
  const humanDocsRoot = path.join(root, 'docs', 'human');
  const agentMirrorRoot = path.join(root, 'docs', 'agents', 'human');

  fs.rmSync(agentMirrorRoot, {recursive: true, force: true});
  fs.mkdirSync(agentMirrorRoot, {recursive: true});

  const written = [];
  const excludedDocIds = new Set();
  const documentTitles = new Map();
  const leaves = flattenPlaybookNodes(humanPlaybookTree).filter((node) => node.docId);

  for (const node of leaves) {
    const sourcePath = resolveHumanSourceFile(humanDocsRoot, node.docId);
    const sourceText = fs.readFileSync(sourcePath, 'utf8');
    const metadata = metadataFromNode(sourceText, node);
    if (metadata.draft || metadata.unlisted) {
      excludedDocIds.add(node.docId);
    }
    documentTitles.set(node.docId, metadata.sidebarLabel ?? metadata.title);
    const output = buildAgentMirrorDocument(sourceText, metadata);
    const outputPath = assertPathInside(
      agentMirrorRoot,
      path.join(agentMirrorRoot, `${node.docId}.md`),
    );
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    fs.writeFileSync(outputPath, output, 'utf8');
    written.push(node.docId);
  }

  const overview = renderAgentMirrorOverview(humanPlaybookTree, excludedDocIds, documentTitles);
  const overviewPath = path.join(agentMirrorRoot, 'index.md');
  fs.writeFileSync(overviewPath, overview, 'utf8');

  written.sort((a, b) => a.localeCompare(b, 'en'));
  return {written, mirrorRoot: agentMirrorRoot};
}

/* node:coverage disable */
function isMain() {
  return Boolean(
    process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href,
  );
}

if (isMain()) {
  const {written, mirrorRoot} = generateAgentDocs();
  console.warn(
    `generate-agent-docs: wrote ${written.length} mirror docs under ${path.relative(process.cwd(), mirrorRoot)}`,
  );
}
/* node:coverage enable */
