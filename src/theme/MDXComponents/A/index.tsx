import {useId, type ReactNode} from 'react';
import isInternalUrl from '@docusaurus/isInternalUrl';
import OriginalAnchor from '@theme-original/MDXComponents/A';
import type {Props} from '@theme/MDXComponents/A';

export default function MDXAnchor(props: Props): ReactNode {
  const hintId = useId();
  const destination = props.href;
  const target = Object.hasOwn(props, 'target') ? props.target
    : destination && !isInternalUrl(destination) ? '_blank' : undefined;
  const newTab = Boolean(destination) && target === '_blank';
  const label = props['aria-label'];
  const describedBy = newTab && props['aria-labelledby']
    ? [props['aria-describedby'], hintId].filter(Boolean).join(' ')
    : props['aria-describedby'];

  return <OriginalAnchor {...props}
    aria-label={newTab && label && !label.includes('opens in a new tab') ? `${label} (opens in a new tab)` : label}
    aria-describedby={describedBy}>
    {props.children}
    {newTab && <>
      <span aria-hidden="true"> ↗</span>
      {(!label || props['aria-labelledby']) && <span id={hintId} className="foundation-sr-only"> (opens in a new tab)</span>}
    </>}
  </OriginalAnchor>;
}
