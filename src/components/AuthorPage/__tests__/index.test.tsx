import {render, screen} from '@testing-library/react';
import AuthorPage from '..';

describe('AuthorPage', () => {
  it('renders profile details and linked articles', () => {
    render(
      <AuthorPage
        author={{
          id: 'ada',
          name: 'Ada Lovelace',
          bio: 'Writes about computing.',
          url: 'https://example.com/ada',
          articles: [
            {
              title: 'First Article',
              description: 'An article description.',
              permalink: '/docs/first-article',
              lastReviewed: '2026-08-25',
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('layout')).toHaveAttribute('data-title', 'Ada Lovelace');
    expect(screen.getByTestId('layout')).toHaveAttribute(
      'data-description',
      'Writes about computing.',
    );
    expect(screen.getByRole('heading', {level: 1, name: 'Ada Lovelace'})).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {level: 2, name: 'All articles by Ada Lovelace'}),
    ).toHaveAttribute('id', 'articles-heading');
    expect(screen.getByRole('heading', {level: 2}).closest('section')).toHaveAttribute(
      'aria-labelledby',
      'articles-heading',
    );
    expect(screen.getByText('Writes about computing.')).toBeInTheDocument();
    const website = screen.getByRole('link', {name: 'Visit website (opens in a new tab)'});
    expect(website).toHaveTextContent('Visit website');
    expect(website).toHaveAttribute('href', 'https://example.com/ada');
    expect(website).toHaveAttribute('target', '_blank');
    expect(website).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', {name: 'First Article'})).toHaveAttribute(
      'href',
      '/docs/first-article',
    );
    expect(screen.getByRole('heading', {level: 3, name: 'First Article'})).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('Last reviewed')).toBeInTheDocument();
    expect(screen.getByText('2026-08-25')).toHaveAttribute('dateTime', '2026-08-25');
  });

  it('uses a default description and empty state without optional profile details', () => {
    render(
      <AuthorPage author={{id: 'empty', name: 'Empty Author', articles: []}} />,
    );

    expect(screen.getByTestId('layout')).toHaveAttribute(
      'data-description',
      'Articles by Empty Author.',
    );
    expect(screen.getByText('All articles by Empty Author')).toBeInTheDocument();
    expect(screen.getByText('This author has no published articles yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', {name: /Visit website/})).not.toBeInTheDocument();
  });

  it('renders a bio without a website and a website without a bio', () => {
    const {unmount} = render(
      <AuthorPage
        author={{
          id: 'bio-only',
          name: 'Bio Only',
          bio: 'Just a biography.',
          articles: [],
        }}
      />,
    );

    expect(screen.getByTestId('layout')).toHaveAttribute('data-description', 'Just a biography.');
    expect(screen.getByText('Just a biography.')).toBeInTheDocument();
    expect(screen.queryByRole('link', {name: /Visit website/})).not.toBeInTheDocument();
    unmount();

    render(
      <AuthorPage
        author={{
          id: 'url-only',
          name: 'URL Only',
          url: 'https://example.com/url-only',
          articles: [],
        }}
      />,
    );

    expect(screen.getByTestId('layout')).toHaveAttribute(
      'data-description',
      'Articles by URL Only.',
    );
    expect(screen.queryByText('Just a biography.')).not.toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Visit website (opens in a new tab)'})).toHaveAttribute(
      'href',
      'https://example.com/url-only',
    );
  });

  it('preserves article order and treats bio markup as text', () => {
    render(
      <AuthorPage
        author={{
          id: 'markup',
          name: 'Markup Author',
          bio: '<script>alert(1)</script>',
          articles: [
            {
              title: 'Older',
              description: 'Kept second.',
              permalink: '/docs/older',
              lastReviewed: '2026-01-01',
            },
            {
              title: 'Newer',
              description: 'Kept first.',
              permalink: '/docs/newer',
              lastReviewed: '2026-12-01',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
    const articleLinks = screen.getAllByRole('link').filter((link) =>
      (link.getAttribute('href') ?? '').startsWith('/docs/'),
    );
    expect(articleLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/docs/older',
      '/docs/newer',
    ]);
  });
});
