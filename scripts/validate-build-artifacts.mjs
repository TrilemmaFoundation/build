#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

/** Deep page used to assert per-page Open Graph URL identity. */
export const OG_URL_SAMPLE_PAGE =
  'docs/playbook/frame/index.html';

/** Hashed or unhashed local-search index emitted into `build/`. */
export const SEARCH_INDEX_BASENAME = /^search-index.*\.json$/;

/** Production script path injected by `@vercel/analytics`. */
export const VERCEL_ANALYTICS_SCRIPT_SRC = '/_vercel/insights/script.js';

function walkFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(filePath));
    } else if (entry.isFile()) {
      files.push(filePath);
    }
  }
  return files;
}

/**
 * @param {string} tag
 * @param {string} attrName
 * @returns {string | null}
 */
function attrFromTag(tag, attrName) {
  const match = tag.match(
    new RegExp(`\\b${attrName}=(?:"([^"]+)"|([^\\s>]+))`, 'i'),
  );
  return match?.[1] ?? match?.[2] ?? null;
}

/**
 * Extract og:url and canonical href from minified Docusaurus HTML.
 * Supports quoted/unquoted values and either attribute order inside the tag.
 * @param {string} html
 * @returns {{ogUrl: string | null, canonical: string | null}}
 */
export function extractOgUrlAndCanonical(html) {
  const ogTag = html.match(/<meta\b[^>]*\bog:url\b[^>]*>/i)?.[0] ?? '';
  const canonicalTag = html.match(/<link\b[^>]*\bcanonical\b[^>]*>/i)?.[0] ?? '';
  return {
    ogUrl: attrFromTag(ogTag, 'content'),
    canonical: attrFromTag(canonicalTag, 'href'),
  };
}

function collectOgUrlErrors(buildRoot, errors) {
  const samplePath = path.join(buildRoot, OG_URL_SAMPLE_PAGE);
  if (!fs.existsSync(samplePath)) {
    errors.push(`Missing Open Graph sample page: build/${OG_URL_SAMPLE_PAGE}`);
    return;
  }

  const html = fs.readFileSync(samplePath, 'utf8');
  const {ogUrl, canonical} = extractOgUrlAndCanonical(html);
  if (!ogUrl) {
    errors.push(`Missing og:url on build/${OG_URL_SAMPLE_PAGE}`);
  }
  if (!canonical) {
    errors.push(`Missing canonical link on build/${OG_URL_SAMPLE_PAGE}`);
  }
  if (ogUrl && canonical && ogUrl !== canonical) {
    errors.push(
      `og:url does not match canonical on build/${OG_URL_SAMPLE_PAGE}: ${ogUrl} !== ${canonical}`,
    );
  }
}

function collectSearchIndexErrors(files, errors) {
  const hasSearchIndex = files.some((filePath) =>
    SEARCH_INDEX_BASENAME.test(path.basename(filePath)),
  );
  if (!hasSearchIndex) {
    errors.push('Missing local search index: build/**/search-index*.json');
  }
}

function collectVercelAnalyticsErrors(hasAnalyticsScript, errors) {
  if (!hasAnalyticsScript) {
    errors.push(
      `Missing Vercel Web Analytics script (${VERCEL_ANALYTICS_SCRIPT_SRC}) in production JavaScript`,
    );
  }
}

export function collectBuildArtifactErrors(
  root = path.resolve(import.meta.dirname, '..'),
  forbiddenPaths = [root, '/vercel/path0'],
) {
  const buildRoot = path.join(root, 'build');
  if (!fs.existsSync(buildRoot)) {
    return ['Build directory missing: build'];
  }

  const files = walkFiles(buildRoot);
  const errors = [];
  let hasAnalyticsScript = false;
  for (const filePath of files) {
    const relativePath = path.relative(root, filePath);
    if (filePath.endsWith('.map')) {
      errors.push(`Source map emitted: ${relativePath}`);
    }
    if (filePath.endsWith('.js')) {
      const source = fs.readFileSync(filePath, 'utf8');
      if (source.includes(VERCEL_ANALYTICS_SCRIPT_SRC)) {
        hasAnalyticsScript = true;
      }
      if (
        forbiddenPaths.some((forbiddenPath) => source.includes(forbiddenPath))
      ) {
        errors.push(`Build path leaked: ${relativePath}`);
      }
    }
  }

  collectOgUrlErrors(buildRoot, errors);
  collectSearchIndexErrors(files, errors);
  collectVercelAnalyticsErrors(hasAnalyticsScript, errors);
  return errors;
}

/* node:coverage disable */
function isMain() {
  return Boolean(
    process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href,
  );
}

if (isMain()) {
  const errors = collectBuildArtifactErrors();
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exitCode = 1;
  } else {
    console.log('Build artifact validation passed.');
  }
}
/* node:coverage enable */
