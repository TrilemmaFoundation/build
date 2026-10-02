import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import type {ReactNode} from 'react';
import type {AuthorPageData} from '@site/src/data/authorPages';

import styles from './styles.module.css';

type Props = {
  author: AuthorPageData;
};

export default function AuthorPage({author}: Props): ReactNode {
  const pageTitle = author.name;
  const pageDescription = author.bio ?? `Articles by ${author.name}.`;

  return (
    <Layout title={pageTitle} description={pageDescription}>
      <main className={styles.authorPage}>
        <header className={styles.header}>
          <h1>{author.name}</h1>
          {author.bio && <p className={styles.bio}>{author.bio}</p>}
          {author.url && (
            <a
              className={styles.website}
              href={author.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit website (opens in a new tab)"
            >
              Visit website
            </a>
          )}
        </header>

        <section aria-labelledby="articles-heading">
          <h2 id="articles-heading">All articles by {author.name}</h2>
          {author.articles.length === 0 ? (
            <p>This author has no published articles yet.</p>
          ) : (
            <ul className={styles.articleList}>
              {author.articles.map((article) => (
                <li key={article.permalink}>
                  <h3>
                    <Link to={article.permalink}>{article.title}</Link>
                  </h3>
                  <p>{article.description}</p>
                  <p className={styles.reviewedDate}>
                    Last reviewed <time dateTime={article.lastReviewed}>{article.lastReviewed}</time>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </Layout>
  );
}
