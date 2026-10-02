import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

import {JSON_SCHEMA, load} from 'js-yaml';

import {isUnderGeneratedContentRoot} from './generatedContentRoots.mjs';
import {extractFrontmatter} from './frontmatterUtils.mjs';
import {validatePublicHttpsUrl} from './publicUrl.mjs';

const baseRequiredFields = ['title', 'description', 'last_reviewed'];
const contentKinds = new Set(['foundation', 'module', 'reference', 'mirror']);
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const authorIdRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function walkMarkdownFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseFrontmatter(content, filePath, errors) {
  const source = extractFrontmatter(content);
  if (source === null) {
    errors.push(`${filePath}: missing frontmatter block`);
    return null;
  }

  try {
    const value = load(source, {schema: JSON_SCHEMA});
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${filePath}: frontmatter must be a YAML mapping`);
      return null;
    }
    return value;
  } catch (error) {
    errors.push(`${filePath}: invalid YAML frontmatter (${error.message})`);
    return null;
  }
}

function validateStringList(frontmatter, field, filePath, errors) {
  const value = frontmatter[field];
  if (typeof value === 'undefined') {
    return null;
  }
  if (!Array.isArray(value)) {
    errors.push(`${filePath}: ${field} must be a YAML list of strings`);
    return null;
  }
  if (value.some((item) => typeof item !== 'string')) {
    errors.push(`${filePath}: ${field} must contain only string values`);
    return null;
  }
  return value;
}

function validateOptionalStringField(frontmatter, field, filePath, errors) {
  const value = frontmatter[field];
  if (typeof value === 'undefined') {
    return;
  }
  if (typeof value !== 'string') {
    errors.push(`${filePath}: ${field} must be a string value`);
  }
}

function validateOptionalBooleanField(frontmatter, field, filePath, errors) {
  const value = frontmatter[field];
  if (typeof value === 'undefined') {
    return;
  }
  if (typeof value !== 'boolean') {
    errors.push(`${filePath}: ${field} must be a boolean value`);
  }
}

export function isValidReviewedDate(value) {
  if (typeof value !== 'string' || !dateRegex.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function loadAuthorIds(root, errors) {
  const authorsPath = path.join(root, 'src', 'data', 'authors.json');
  if (!fs.existsSync(authorsPath)) {
    errors.push(`${authorsPath}: author registry is missing`);
    return new Set();
  }

  try {
    const authors = JSON.parse(fs.readFileSync(authorsPath, 'utf8'));
    if (!Array.isArray(authors)) {
      throw new TypeError('author registry must be an array');
    }
    const ids = [];
    for (const author of authors) {
      if (typeof author?.id !== 'string' || !authorIdRegex.test(author.id)) {
        errors.push(`${authorsPath}: author id must be a lowercase kebab-case string`);
        continue;
      }
      ids.push(author.id);
      if (typeof author.name !== 'string' || author.name.trim().length === 0) {
        errors.push(`${authorsPath}: author '${author.id}' name must be a non-empty string value`);
      }
      if (typeof author.bio !== 'undefined') {
        if (typeof author.bio !== 'string' || author.bio.trim().length === 0) {
          errors.push(
            `${authorsPath}: author '${author.id}' bio must be a non-empty string value`,
          );
        }
      }
      if (typeof author.url === 'undefined') {
        continue;
      }
      if (typeof author.url !== 'string') {
        errors.push(
          `${authorsPath}: author '${author.id}' url must be a string value`,
        );
        continue;
      }
      const urlError = validatePublicHttpsUrl(author.url);
      if (urlError) {
        errors.push(
          `${authorsPath}: author '${author.id}' url ${urlError}`,
        );
      }
    }
    if (ids.length === 0) {
      errors.push(`${authorsPath}: author registry must define at least one author ID`);
    }
    return new Set(ids);
  } catch (error) {
    errors.push(`${authorsPath}: invalid author registry (${error.message})`);
    return new Set();
  }
}

function validateMirrorFile(filePath, frontmatter) {
  const errors = [];
  for (const field of ['title', 'description']) {
    if (!Object.hasOwn(frontmatter, field)) {
      errors.push(`${filePath}: missing required frontmatter field '${field}'`);
    }
  }

  if (!Object.hasOwn(frontmatter, 'content_kind')) {
    errors.push(`${filePath}: missing required frontmatter field 'content_kind'`);
  } else if (frontmatter.content_kind !== 'mirror') {
    errors.push(`${filePath}: generated mirror docs must use content_kind: mirror`);
  }

  validateOptionalStringField(frontmatter, 'canonical_human_url', filePath, errors);
  validateOptionalStringField(frontmatter, 'source_doc_id', filePath, errors);
  validateOptionalStringField(frontmatter, 'slug', filePath, errors);
  validateOptionalStringField(frontmatter, 'section', filePath, errors);
  validateStringList(frontmatter, 'tags', filePath, errors);

  return errors;
}

function validateCanonicalFile(filePath, frontmatter, authorIds) {
  const errors = [];

  for (const field of baseRequiredFields) {
    if (!Object.hasOwn(frontmatter, field)) {
      errors.push(`${filePath}: missing required frontmatter field '${field}'`);
    }
  }

  const rawContentKind = frontmatter.content_kind;
  let contentKind = 'module';
  if (typeof rawContentKind !== 'undefined') {
    if (typeof rawContentKind !== 'string') {
      errors.push(`${filePath}: content_kind must be a string value`);
    } else if (!contentKinds.has(rawContentKind)) {
      errors.push(
        `${filePath}: content_kind must be one of ${[...contentKinds].join(', ')}`,
      );
    } else if (rawContentKind === 'mirror') {
      errors.push(`${filePath}: content_kind mirror is reserved for generated docs`);
    } else {
      contentKind = rawContentKind;
    }
  }

  if (contentKind === 'module' && !Object.hasOwn(frontmatter, 'authors')) {
    errors.push(`${filePath}: missing required frontmatter field 'authors'`);
  }

  validateStringList(frontmatter, 'tags', filePath, errors);
  validateOptionalBooleanField(
    frontmatter,
    'useDescriptionAsSubtitle',
    filePath,
    errors,
  );
  const authors = validateStringList(frontmatter, 'authors', filePath, errors);
  if (authors) {
    if (authors.length === 0) {
      errors.push(`${filePath}: authors must contain at least one author ID`);
    }
    for (const author of authors) {
      if (!authorIds.has(author)) {
        errors.push(`${filePath}: unknown author ID '${author}'`);
      }
    }
  }

  if (!Object.hasOwn(frontmatter, 'last_reviewed')) {
    errors.push(`${filePath}: missing last_reviewed value`);
  } else if (!isValidReviewedDate(frontmatter.last_reviewed)) {
    errors.push(
      `${filePath}: invalid last_reviewed '${String(frontmatter.last_reviewed)}', expected valid YYYY-MM-DD`,
    );
  }

  return errors;
}

function validateFile(filePath, authorIds, root, errors) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const frontmatter = parseFrontmatter(raw, filePath, errors);
  if (!frontmatter) {
    return;
  }

  const generated = isUnderGeneratedContentRoot(filePath, root);
  const fileErrors = generated
    ? validateMirrorFile(filePath, frontmatter)
    : validateCanonicalFile(filePath, frontmatter, authorIds);
  errors.push(...fileErrors);
}

const SHOWCASE_TABLE_HEADER = '| Name | Description | Availability | Links |';

function isMarkdownTableSeparator(line) {
  const trimmed = line.trim();
  return /^\|[\s:|-]+\|$/.test(trimmed) && trimmed.includes('-');
}

function firstMarkdownTableHeader(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && !isMarkdownTableSeparator(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

function validateShowcaseTable(root, errors) {
  const showcasePath = path.join(root, 'docs', 'showcase', 'microproducts.md');
  if (!fs.existsSync(showcasePath)) {
    errors.push('docs/showcase/microproducts.md: file is missing');
    return;
  }

  const header = firstMarkdownTableHeader(fs.readFileSync(showcasePath, 'utf8'));
  if (header !== SHOWCASE_TABLE_HEADER) {
    errors.push(
      `${showcasePath}: table header must be exactly '${SHOWCASE_TABLE_HEADER}'`,
    );
  }
}

export function collectFrontmatterErrors(
  root = path.resolve(import.meta.dirname, '..'),
) {
  const errors = [];
  const authorIds = loadAuthorIds(root, errors);

  for (const directory of ['docs', 'templates', 'product-templates']) {
    const directoryPath = path.join(root, directory);
    if (!fs.existsSync(directoryPath)) {
      errors.push(`${directory} directory does not exist`);
      continue;
    }
    for (const filePath of walkMarkdownFiles(directoryPath)) {
      validateFile(filePath, authorIds, root, errors);
    }
  }

  validateShowcaseTable(root, errors);
  return errors;
}

/* node:coverage disable */
function isMain() {
  return Boolean(
    process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href,
  );
}

if (isMain()) {
  const errors = collectFrontmatterErrors();
  if (errors.length > 0) {
    console.error('Frontmatter validation failed:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log('Frontmatter validation passed.');
  }
}
/* node:coverage enable */
