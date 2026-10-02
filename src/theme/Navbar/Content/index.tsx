import { useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import SearchBar from '@theme/SearchBar';

const links = [ ['Humans', '/docs/request-for-microproducts'], ['Agents', '/agents'], ['Templates', '/templates'], ['Showcase', '/showcase'] ];
let focusAfterDrawerNavigation = false;

export default function NavbarContent() {
  const { pathname } = useLocation();
  const sidebar = useNavbarMobileSidebar();
  const pageToggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = header.current;
    if (!node) return;
    const update = () => document.documentElement.style.setProperty('--foundation-shell-height', `${node.getBoundingClientRect().height}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--foundation-shell-height'); };
  }, []);
  const currentPath = useRef(pathname);
  currentPath.current = pathname;
  useEffect(() => {
    if (!focusAfterDrawerNavigation) return;
    focusAfterDrawerNavigation = false;
    const frame = requestAnimationFrame(() => {
      const main = document.querySelector<HTMLElement>('main');
      if (main) { main.tabIndex = -1; main.focus({ preventScroll: true }); }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  useEffect(() => {
    if (!sidebar.shown || !sidebar.shouldRender) return;
    const openedPath = currentPath.current;
    const covered = [...document.querySelectorAll<HTMLElement>('.playbook-header, .main-wrapper, footer, [class*=skipToContent]')];
    const previous = covered.map(node => node.inert);
    covered.forEach(node => { node.inert = true; });
    const focusDrawer = (event?: TransitionEvent) => {
      if (event && (!(event.target instanceof Element) || !event.target.matches('.navbar-sidebar'))) return;
      if (document.activeElement?.closest('.navbar-sidebar')) return;
      document.querySelector<HTMLElement>('.navbar-sidebar__close')?.focus({ preventScroll: true });
    };
    const frame = requestAnimationFrame(() => focusDrawer());
    // The first frame can precede the drawer's visibility transition.
    document.addEventListener('transitionend', focusDrawer);
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); sidebar.toggle(); }
      if (event.key !== 'Tab') return;
      const controls = [...document.querySelectorAll<HTMLElement>('.navbar-sidebar a[href], .navbar-sidebar button')]
        .filter(node => node.getClientRects().length && !node.closest('[inert]'));
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('transitionend', focusDrawer);
      document.removeEventListener('keydown', onKey);
      covered.forEach((node, index) => { node.inert = previous[index]; });
      if (window.location.pathname === openedPath && pageToggle.current?.getClientRects().length) pageToggle.current.focus();
      else if (window.location.pathname !== openedPath) {
        // Docusaurus keeps the old page until the next route's chunk is ready.
        focusAfterDrawerNavigation = true;
      } else {
        const main = document.querySelector<HTMLElement>('main');
        if (main) { main.tabIndex = -1; main.focus({ preventScroll: true }); }
      }
    };
  }, [sidebar.shown, sidebar.shouldRender, sidebar.toggle]);
  return <div ref={header} className="playbook-header foundation-local-nav">
    <nav className="foundation-local-inner playbook-tools" aria-label="Build Trilemma navigation">
      <Link to="/" className="foundation-local-brand">Build Trilemma</Link>
      {!sidebar.disabled && <button ref={pageToggle} type="button" className="playbook-page-toggle" aria-label="Open page navigation" aria-expanded={sidebar.shown} onClick={sidebar.toggle}>Pages</button>}
      <div className="playbook-links">{links.map(([label, to]) => <Link key={to} to={to} aria-current={pathname === to || pathname.startsWith(`${to}/`) || (label === 'Humans' && pathname.startsWith('/docs/')) ? 'page' : undefined}>{label}</Link>)}</div>
      <div className="playbook-search"
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            // Use browser geometry; the plugin overcounts the panel padding.
            event.currentTarget.querySelector('[role="option"][aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
          }
          if (event.key !== 'Escape' || !(event.target instanceof HTMLInputElement)) return;
          // The plugin blurs on close and opens on native focus. Restore focus
          // without reopening; subsequent user focus keeps the native behavior.
          const input = event.target;
          const keepClosed = (focusEvent: FocusEvent) => focusEvent.stopImmediatePropagation();
          input.addEventListener('focus', keepClosed, true);
          input.focus({ preventScroll: true });
          input.removeEventListener('focus', keepClosed, true);
        }}><SearchBar /></div>
    </nav>
  </div>;
}
