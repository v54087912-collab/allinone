/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Shared UI behaviors: Theme, Mobile Nav, Cookie Banner, Toasts, Tool Search, SEO
export function initSiteShell(): void {
  initTheme();
  initMobileNav();
  initCookieBanner();
  highlightActiveNav();
  initToolSearch();
  syncSeoMetadata();
}

/**
 * Ensures canonical & OpenGraph URLs match active host in production (e.g., custom domains or pages.dev)
 */
function syncSeoMetadata(): void {
  try {
    if (typeof window === 'undefined' || !window.location) return;
    const currentUrl = window.location.origin + window.location.pathname;
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (canonical) {
        canonical.href = currentUrl;
      }
      const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.content = currentUrl;
      }
    }
  } catch (e) {
    // Non-critical SEO sync
  }
}

/**
 * Robust Dark/Light theme manager with CSS variables, data-theme, and localStorage
 */
function initTheme(): void {
  const themeToggleButtons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  
  const savedTheme = localStorage.getItem('toolora_theme') || localStorage.getItem('quickpic_theme');
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const isDark = savedTheme ? savedTheme === 'dark' : mediaQuery.matches;
  applyTheme(isDark);

  themeToggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const currentDark = document.documentElement.classList.contains('dark') ||
                          document.documentElement.getAttribute('data-theme') === 'dark';
      const newDark = !currentDark;
      applyTheme(newDark);
      localStorage.setItem('toolora_theme', newDark ? 'dark' : 'light');
    });
  });

  // Listen to OS-level system theme changes if user hasn't explicitly set a preference
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('toolora_theme')) {
      applyTheme(e.matches);
    }
  });
}

function applyTheme(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // Update toggle icons and aria-labels
  document.querySelectorAll('[data-theme-icon-sun]').forEach((el) => {
    (el as HTMLElement).style.display = isDark ? 'inline-block' : 'none';
  });
  document.querySelectorAll('[data-theme-icon-moon]').forEach((el) => {
    (el as HTMLElement).style.display = isDark ? 'none' : 'inline-block';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  });

  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (favicon) {
    favicon.href = isDark ? '/logo-dark.jpg' : '/logo-light.jpg';
  }

  // Update light/dark logos
  document.querySelectorAll<HTMLElement>('.logo-light').forEach((el) => {
    el.style.display = isDark ? 'none' : 'inline-block';
  });
  document.querySelectorAll<HTMLElement>('.logo-dark').forEach((el) => {
    el.style.display = isDark ? 'inline-block' : 'none';
  });

  window.dispatchEvent(new CustomEvent('toolora_theme_changed', { detail: { isDark } }));
}

/**
 * Mobile responsive navigation menu drawer with flawless scrolling
 */
function initMobileNav(): void {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const mobileMenu = document.getElementById('mobile-nav-menu');
  const closeBtn = document.getElementById('mobile-nav-close');

  if (!toggleBtn || !mobileMenu) return;

  const toggle = (show?: boolean) => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    const nextState = show !== undefined ? show : !isExpanded;
    toggleBtn.setAttribute('aria-expanded', String(nextState));
    if (nextState) {
      mobileMenu.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    } else {
      mobileMenu.classList.add('hidden');
      document.body.style.overflow = '';
    }
  };

  toggleBtn.addEventListener('click', () => toggle());
  if (closeBtn) closeBtn.addEventListener('click', () => toggle(false));

  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
      toggle(false);
    }
  });

  // Auto-close drawer when clicking on any link inside
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggle(false));
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      toggle(false);
    }
  });
}

/**
 * Cookie consent banner with Accept / Decline
 */
function initCookieBanner(): void {
  const banner = document.getElementById('cookie-consent-banner');
  if (!banner) return;

  const consent = localStorage.getItem('toolora_cookie_consent') || localStorage.getItem('quickpic_cookie_consent');
  if (consent) {
    banner.classList.add('hidden');
    return;
  }

  banner.classList.remove('hidden');

  const acceptBtn = document.getElementById('cookie-accept-all');
  const declineBtn = document.getElementById('cookie-decline');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('toolora_cookie_consent', 'accepted');
      banner.classList.add('hidden');
      showToast('Cookie preferences saved: All enabled', 'success');
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      localStorage.setItem('toolora_cookie_consent', 'essential_only');
      banner.classList.add('hidden');
      showToast('Cookie preferences saved: Essential only', 'info');
    });
  }
}

/**
 * Highlights active page in navigation based on current pathname
 */
function highlightActiveNav(): void {
  const currentPath = window.location.pathname.replace(/^\//, '') || 'index.html';
  
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('nav a, #mobile-nav-menu a');
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const cleanHref = href.replace(/^\//, '');
    if (cleanHref === currentPath || (currentPath === '' && cleanHref === 'index.html')) {
      link.classList.add('text-blue-600', 'dark:text-blue-400', 'font-semibold');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/**
 * Interactive tool search and category filtering for the homepage
 */
function initToolSearch(): void {
  const searchInput = document.getElementById('tool-search-input') as HTMLInputElement | null;
  const searchClearBtn = document.getElementById('tool-search-clear') as HTMLButtonElement | null;
  const filterBtns = document.querySelectorAll<HTMLButtonElement>('.tool-filter-btn');
  const toolsGrid = document.getElementById('tools-grid');
  const countBadge = document.getElementById('tool-match-count');
  const noResults = document.getElementById('tools-no-results');
  const noResultsMsg = document.getElementById('tools-no-results-msg');
  const resetBtn = document.getElementById('tools-reset-search-btn');

  if (!toolsGrid) return;

  const cards = Array.from(toolsGrid.querySelectorAll<HTMLElement>('article'));
  if (cards.length === 0) return;

  let activeCategory = 'all';

  const filterCards = () => {
    const query = (searchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const category = card.getAttribute('data-category') || '';
      const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
      const badge = card.querySelector('span')?.textContent?.toLowerCase() || '';
      const desc = card.querySelector('p')?.textContent?.toLowerCase() || '';
      const text = `${title} ${badge} ${desc}`;

      const matchesCat = activeCategory === 'all' || category === activeCategory;
      const matchesQuery = !query || text.includes(query);

      const isVisible = matchesCat && matchesQuery;
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    if (searchClearBtn) {
      if (query.length > 0) {
        searchClearBtn.classList.remove('hidden');
      } else {
        searchClearBtn.classList.add('hidden');
      }
    }

    if (countBadge) {
      countBadge.textContent = `Showing ${visibleCount} of ${cards.length} utilities`;
    }

    if (noResults) {
      if (visibleCount === 0) {
        noResults.classList.remove('hidden');
        if (noResultsMsg && query) {
          noResultsMsg.textContent = `No utilities found matching "${query}". Try searching for compress, pdf, convert, crop, or ocr.`;
        }
      } else {
        noResults.classList.add('hidden');
      }
    }
  };

  searchInput?.addEventListener('input', filterCards);

  searchClearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    filterCards();
    searchInput?.focus();
  });

  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    activeCategory = 'all';
    filterBtns.forEach((b) => updateFilterButtonState(b, 'all'));
    filterCards();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-filter') || 'all';
      filterBtns.forEach((b) => updateFilterButtonState(b, activeCategory));
      filterCards();
    });
  });

  function updateFilterButtonState(btn: HTMLButtonElement, currentCat: string) {
    const cat = btn.getAttribute('data-filter') || 'all';
    const isSelected = cat === currentCat;
    if (isSelected) {
      btn.className = 'tool-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs cursor-pointer transition-all';
    } else {
      btn.className = 'tool-filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all';
    }
  }

  // Keyboard shortcut: Press "/" to focus search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }
  });
}

/**
 * Toast notification system
 */
export function showToast(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgClass =
    type === 'success'
      ? 'bg-emerald-600 text-white'
      : type === 'error'
      ? 'bg-rose-600 text-white'
      : type === 'warning'
      ? 'bg-amber-600 text-white'
      : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900';

  toast.className = `${bgClass} px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center justify-between gap-3 pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0`;
  
  toast.innerHTML = `
    <span>${message}</span>
    <button aria-label="Close notification" class="opacity-75 hover:opacity-100 text-sm font-bold ml-2 cursor-pointer">&times;</button>
  `;

  toast.querySelector('button')?.addEventListener('click', () => {
    toast.remove();
  });

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Auto initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteShell);
  } else {
    initSiteShell();
  }
}
