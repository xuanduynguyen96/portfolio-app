// Progressive enhancement: html[data-menu-enhanced] (set in base-layout) collapses the
// mobile nav; marking html[data-menu-ready] stops the failsafe from un-collapsing it.
function bindMobileMenu() {
  const header = document.querySelector<HTMLElement>('.site-header');
  const toggle = header?.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = header?.querySelector<HTMLElement>('[data-menu]');
  if (!header || !toggle || !menu) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.toggleAttribute('data-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) setOpen(false);
  });
  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  document.documentElement.dataset.menuReady = '';
}

// Header DOM is replaced on every ClientRouter navigation, so re-bind each time.
document.addEventListener('astro:page-load', bindMobileMenu);
