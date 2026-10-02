import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {usePluginData} from '@docusaurus/useGlobalData';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import type {Props} from '@theme/DocItem/Content';
import {authorsById} from '@site/src/data/authors';

import styles from './styles.module.css';

type ReadTimeData = {
  readTimes?: Record<string, number>;
};

type BuildTrilemmaFrontMatter = {
  authors?: unknown;
  content_kind?: unknown;
  useDescriptionAsSubtitle?: unknown;
};

const INSTITUTIONAL_AUTHOR_ID = 'trilemma-foundation';
const institutionalContentKinds = new Set(['foundation', 'reference']);

function useSyntheticTitle(): string | null {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

function useDocSubtitle(hasSyntheticTitle: boolean): string | null {
  const {metadata, frontMatter} = useDoc();
  const buildFrontMatter = frontMatter as BuildTrilemmaFrontMatter;

  if (
    !hasSyntheticTitle ||
    buildFrontMatter.content_kind === 'mirror' ||
    buildFrontMatter.useDescriptionAsSubtitle !== true
  ) {
    return null;
  }

  const description = metadata.description?.trim();
  return description || null;
}

function DocByline(): ReactNode {
  const {metadata, frontMatter} = useDoc();
  const readTimeData = usePluginData('doc-read-times') as ReadTimeData | undefined;
  const buildFrontMatter = frontMatter as BuildTrilemmaFrontMatter;
  const contentKind =
    typeof buildFrontMatter.content_kind === 'string'
      ? buildFrontMatter.content_kind
      : 'module';
  const isInstitutional = institutionalContentKinds.has(contentKind);
  const authorIds = Array.isArray(buildFrontMatter.authors)
    ? buildFrontMatter.authors.filter((authorId): authorId is string => typeof authorId === 'string')
    : [];
  const bylineAuthorIds =
    isInstitutional && authorIds.length === 0
      ? [INSTITUTIONAL_AUTHOR_ID]
      : authorIds;
  const pageAuthors = bylineAuthorIds
    .map((authorId) => authorsById.get(authorId))
    .filter((author) => author !== undefined);
  const readMinutes = readTimeData?.readTimes?.[metadata.source];
  const usesInstitutionalByline =
    pageAuthors.length > 0 &&
    pageAuthors.every((author) => author.id === INSTITUTIONAL_AUTHOR_ID);

  if (pageAuthors.length === 0 && !readMinutes) {
    return null;
  }

  return (
    <p className={styles.docByline}>
      {pageAuthors.length > 0 && (
        <span>
          {usesInstitutionalByline ? 'Maintained by ' : 'By '}
          {pageAuthors.map((author, index) => (
            <React.Fragment key={author.id}>
              {index > 0 && ', '}
              <Link to={`/authors/${author.id}`}>{author.name}</Link>
            </React.Fragment>
          ))}
        </span>
      )}
      {pageAuthors.length > 0 && readMinutes && (
        <span className={styles.separator}>·</span>
      )}
      {readMinutes && (
        <span>
          {readMinutes} min read
        </span>
      )}
    </p>
  );
}

export default function DocItemContent({children}: Props): ReactNode {
  const syntheticTitle = useSyntheticTitle();
  const subtitle = useDocSubtitle(Boolean(syntheticTitle));
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
          {subtitle && <p className={styles.docSubtitle}>{subtitle}</p>}
        </header>
      )}
      <DocByline />
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
