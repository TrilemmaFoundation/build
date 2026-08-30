import {cleanup, render, screen} from '@testing-library/react';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {usePluginData} from '@docusaurus/useGlobalData';
import {authorsById} from '@site/src/data/authors';
import DocItemContent from '../index';

const mockUseDoc = useDoc as jest.Mock;
const mockUsePluginData = usePluginData as jest.Mock;

function renderDoc(
  frontMatter: Record<string, unknown>,
  source: string,
  options: {
    contentTitle?: string;
    description?: string;
    includeReadTime?: boolean;
  } = {},
) {
  mockUseDoc.mockReturnValue({
    metadata: {
      title: 'Doc Title',
      description: options.description ?? 'Doc description',
      source,
    },
    frontMatter,
    contentTitle: options.contentTitle,
  });
  mockUsePluginData.mockReturnValue(
    options.includeReadTime === false
      ? undefined
      : {
          readTimes: {
            [source]: 1,
          },
        },
  );

  render(
    <DocItemContent>
      <p>Body</p>
    </DocItemContent>,
  );
}

describe('DocItemContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders foundation pages as institutionally maintained', () => {
    renderDoc(
      {
        content_kind: 'foundation',
      },
      '@site/docs/human/request-for-microproducts.md',
    );

    expect(screen.getByText(/Maintained by/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: 'Trilemma Foundation'}),
    ).toHaveAttribute('href', '/authors/trilemma-foundation');
    expect(screen.getByText('1 min read')).toBeInTheDocument();
    expect(screen.queryByText(/^By/i)).not.toBeInTheDocument();
  });

  it('renders the frontmatter description as a subtitle', () => {
    renderDoc(
      {content_kind: 'module', useDescriptionAsSubtitle: true},
      '@site/docs/human/playbook/frame/frame.md',
      {description: 'Orient the reader before the document begins.'},
    );

    expect(
      screen.getByText('Orient the reader before the document begins.'),
    ).toHaveClass('docSubtitle');
  });

  it('does not render the subtitle unless the frontmatter flag is true', () => {
    renderDoc(
      {content_kind: 'module'},
      '@site/docs/human/playbook/frame/frame.md',
    );

    expect(screen.queryByText('Doc description')).not.toBeInTheDocument();
  });

  it('does not render subtitles on generated mirror pages', () => {
    renderDoc(
      {content_kind: 'mirror', useDescriptionAsSubtitle: true},
      '@site/docs/agents/human/playbook/frame/frame.md',
    );

    expect(screen.queryByText('Doc description')).not.toBeInTheDocument();
  });

  it('renders reference pages as institutionally maintained', () => {
    renderDoc(
      {
        content_kind: 'reference',
        authors: ['trilemma-foundation'],
      },
      '@site/docs/human/authors.mdx',
    );

    expect(screen.getByText(/Maintained by/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: 'Trilemma Foundation'}),
    ).toBeInTheDocument();
  });

  it('renders foundation pages with personal authors using By', () => {
    renderDoc(
      {
        content_kind: 'foundation',
        authors: ['mohammad-ashkani'],
      },
      '@site/docs/human/playbook/frame/frame.md',
    );

    expect(screen.getByText(/^By/i)).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Mohammad Ashkani'})).toHaveAttribute(
      'href',
      '/authors/mohammad-ashkani',
    );
    expect(screen.queryByText(/Maintained by/i)).not.toBeInTheDocument();
  });

  it('renders module pages with normal author bylines', () => {
    renderDoc(
      {
        authors: ['mohammad-ashkani'],
      },
      '@site/docs/human/playbook/frame/frame.md',
    );

    expect(screen.getByText(/^By/i)).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Mohammad Ashkani'})).toHaveAttribute(
      'href',
      '/authors/mohammad-ashkani',
    );
    expect(screen.queryByText(/Maintained by/i)).not.toBeInTheDocument();
  });

  it('renders unknown authors as read-time-only metadata', () => {
    renderDoc(
      {authors: [123, 'unknown-author']},
      '@site/docs/human/playbook/unknown.md',
    );

    expect(screen.getByText('1 min read')).toBeInTheDocument();
    expect(screen.queryByText(/^By/i)).not.toBeInTheDocument();
  });

  it('keeps bylines on-site even when the author has an external profile URL', () => {
    renderDoc(
      {authors: ['matt-faltyn']},
      '@site/docs/human/playbook/on-site.md',
      {includeReadTime: false},
    );

    const byline = screen.getByRole('link', {name: 'Matt Faltyn'});
    expect(byline).toHaveAttribute('href', '/authors/matt-faltyn');
    expect(byline).not.toHaveAttribute('href', 'https://www.mattfaltyn.com');
    expect(byline).not.toHaveAttribute('target');
  });

  it('links authors without profile URLs to their native profile', () => {
    authorsById.set('plain-author', {id: 'plain-author', name: 'Plain Author'});
    try {
      renderDoc(
        {authors: ['plain-author']},
        '@site/docs/human/playbook/plain-author.md',
        {includeReadTime: false},
      );
      expect(screen.getByRole('link', {name: 'Plain Author'})).toHaveAttribute(
        'href',
        '/authors/plain-author',
      );
    } finally {
      authorsById.delete('plain-author');
    }
  });

  it('separates multiple authors', () => {
    renderDoc(
      {authors: ['mohammad-ashkani', 'trilemma-foundation']},
      '@site/docs/human/playbook/coauthored.md',
    );
    expect(
      screen.getByRole('link', {name: 'Mohammad Ashkani'}).parentElement,
    ).toHaveTextContent('By Mohammad Ashkani, Trilemma Foundation');
  });

  it('drops unknown coauthors from native byline links', () => {
    renderDoc(
      {authors: ['unknown-author', 'rowan-lindsay']},
      '@site/docs/human/playbook/mixed.md',
      {includeReadTime: false},
    );

    expect(screen.getByRole('link', {name: 'Rowan Lindsay'})).toHaveAttribute(
      'href',
      '/authors/rowan-lindsay',
    );
    expect(screen.queryByText('unknown-author')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: 'Rowan Lindsay'}).parentElement,
    ).toHaveTextContent('By Rowan Lindsay');
  });

  it('keeps the byline when the markdown title is explicit or hidden', () => {
    renderDoc(
      {authors: ['mohammad-ashkani']},
      '@site/docs/human/explicit.md',
      {contentTitle: 'Explicit title'},
    );
    expect(screen.queryByRole('heading', {name: 'Doc Title'})).not.toBeInTheDocument();
    expect(screen.getByText(/^By/i)).toBeInTheDocument();
    expect(screen.getByText('1 min read')).toBeInTheDocument();

    cleanup();

    renderDoc(
      {authors: ['mohammad-ashkani'], hide_title: true},
      '@site/docs/human/hidden.md',
    );
    expect(screen.queryByRole('heading', {name: 'Doc Title'})).not.toBeInTheDocument();
    expect(screen.getByText(/^By/i)).toBeInTheDocument();
    expect(screen.getByText('1 min read')).toBeInTheDocument();
  });

  it('omits an empty byline and still synthesizes the title when needed', () => {
    renderDoc({}, '@site/docs/human/no-metadata.md', {includeReadTime: false});
    expect(screen.getByRole('heading', {name: 'Doc Title'})).toBeInTheDocument();
    expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
  });
});
