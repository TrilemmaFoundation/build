import {fireEvent, render, screen} from '@testing-library/react';
import MDXAnchor from '../index';

jest.mock('@theme-original/MDXComponents/A', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'a'>) => <a {...props} />,
}), {virtual: true});

describe('Markdown link new-tab cues', () => {
  it.each(['https://example.org/source', '//example.org/source'])('announces an external destination with rich children (%s)', (href) => {
    render(<MDXAnchor href={href}><strong>Read</strong> the source</MDXAnchor>);
    const link = screen.getByRole('link', {name: 'Read the source (opens in a new tab)'});
    expect(link).toHaveAttribute('href', href);
    expect(link.querySelector('strong')).toHaveTextContent('Read');
    expect(link.querySelector('[aria-hidden="true"]')).toHaveTextContent('↗');
  });

  it.each(['/docs/guide', 'relative-guide', '#user-content-fn-1'])('preserves internal links and footnote props without a cue (%s)', (href) => {
    const onClick = jest.fn((event: React.MouseEvent) => event.preventDefault());
    render(<>
      <p id="footnote-description">Reference detail</p>
      <MDXAnchor href={href} id="footnote-ref" className="reference" role="doc-noteref"
        title="Read reference" aria-describedby="footnote-description" onClick={onClick}>
        <strong>Read</strong> the reference
      </MDXAnchor>
    </>);
    const link = screen.getByRole('doc-noteref', {name: 'Read reference'});
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('id', 'footnote-ref');
    expect(link).toHaveAttribute('title', 'Read reference');
    expect(link).toHaveClass('reference');
    expect(link).toHaveAccessibleDescription('Reference detail');
    expect(link).not.toHaveAttribute('target');
    expect(link.querySelector('strong')).toHaveTextContent('Read');
    expect(link).not.toHaveTextContent('opens in a new tab');
    expect(link.querySelector('[aria-hidden="true"]')).toBeNull();
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each(['_self', '_parent', '_top', '', undefined])('respects explicitly supplied targets without a new-tab cue (%p)', (target) => {
    render(<MDXAnchor href="https://example.org" target={target} rel="author"><em>Visit</em></MDXAnchor>);
    const link = screen.getByRole('link', {name: 'Visit'});
    if (target === undefined) expect(link).not.toHaveAttribute('target');
    else expect(link).toHaveAttribute('target', target);
    expect(link).toHaveAttribute('rel', 'author');
    expect(link.querySelector('em')).toHaveTextContent('Visit');
    expect(link).not.toHaveTextContent('opens in a new tab');
  });

  it('announces an internal link explicitly opened in a new tab', () => {
    render(<MDXAnchor href="/docs/guide" target="_blank" rel="noopener noreferrer">Read guide</MDXAnchor>);
    const link = screen.getByRole('link', {name: 'Read guide (opens in a new tab)'});
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each(['Product source', 'Product source (opens in a new tab)'])('adds a cue once to a custom accessible label (%s)', (label) => {
    render(<>
      <p id="source-context">Pinned source documentation</p>
      <MDXAnchor href="https://example.org/source" aria-label={label} aria-describedby="source-context">Source</MDXAnchor>
    </>);
    const link = screen.getByRole('link', {name: 'Product source (opens in a new tab)'});
    expect(link).toHaveTextContent('Source');
    expect(link).toHaveAccessibleDescription('Pinned source documentation');
    expect(link).toHaveAttribute('aria-describedby', 'source-context');
    expect(link.querySelector('.foundation-sr-only')).toBeNull();
  });

  it('preserves labelled names and existing descriptions with unique tab-cue references', () => {
    render(<>
      <span id="source-label">External reference</span>
      <p id="source-context">Pinned source documentation</p>
      <MDXAnchor href="https://example.org/first" aria-labelledby="source-label" aria-describedby="source-context">First</MDXAnchor>
      <MDXAnchor href="https://example.org/second" aria-labelledby="source-label" aria-label="Fallback label">Second</MDXAnchor>
    </>);
    const links = screen.getAllByRole('link', {name: 'External reference'});
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAccessibleDescription('Pinned source documentation (opens in a new tab)');
    expect(links[1]).toHaveAccessibleDescription('(opens in a new tab)');
    const hintIds = links.map((link) => link.querySelector('.foundation-sr-only')?.id);
    expect(hintIds.every(Boolean)).toBe(true);
    expect(new Set(hintIds).size).toBe(2);
    expect(links[0]).toHaveAttribute('aria-describedby', `source-context ${hintIds[0]}`);
    expect(links[1]).toHaveAttribute('aria-describedby', hintIds[1]);
  });

  it.each([undefined, ''])('keeps an anchor without a destination free of navigation cues (%p)', (href) => {
    render(<MDXAnchor href={href} id="named-anchor" title="Section target" target="_blank"><em>Target</em></MDXAnchor>);
    const anchor = screen.getByText('Target').closest('a');
    expect(anchor).toHaveAttribute('id', 'named-anchor');
    expect(anchor).toHaveAttribute('title', 'Section target');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor?.querySelector('em')).toHaveTextContent('Target');
    expect(anchor).not.toHaveTextContent('opens in a new tab');
    expect(anchor?.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
