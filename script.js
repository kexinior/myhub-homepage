const THEME_STORAGE_KEY = 'lxt-theme';
const THEME_COLORS = {
  light: '#f4f1ff',
  dark: '#151225',
};

const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const systemTheme = window.matchMedia?.('(prefers-color-scheme: dark)');

const getStoredTheme = () => {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
};

const getSystemTheme = () => (systemTheme?.matches ? 'dark' : 'light');
let hasStoredTheme = Boolean(getStoredTheme());

function applyTheme(theme, { persist = false, animate = true } = {}) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  if (animate) {
    root.classList.add('theme-transitioning');
    window.setTimeout(() => root.classList.remove('theme-transitioning'), 320);
  }

  root.dataset.theme = nextTheme;
  themeToggle?.setAttribute('aria-pressed', String(nextTheme === 'dark'));
  themeToggle?.setAttribute('aria-label', `切换到${nextTheme === 'dark' ? '浅色' : '深色'}模式`);
  themeToggle?.setAttribute('title', `切换到${nextTheme === 'dark' ? '浅色' : '深色'}模式`);
  if (themeMeta) themeMeta.content = THEME_COLORS[nextTheme];

  if (persist) {
    hasStoredTheme = true;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Theme switching still works when storage is unavailable.
    }
  }
}

applyTheme(root.dataset.theme || getStoredTheme() || getSystemTheme(), { animate: false });

themeToggle?.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', { persist: true });
});

const handleSystemThemeChange = (event) => {
  if (!hasStoredTheme) applyTheme(event.matches ? 'dark' : 'light');
};

if (systemTheme?.addEventListener) systemTheme.addEventListener('change', handleSystemThemeChange);
else systemTheme?.addListener?.(handleSystemThemeChange);

window.addEventListener('storage', (event) => {
  if (event.key !== THEME_STORAGE_KEY || (event.newValue !== 'light' && event.newValue !== 'dark')) return;
  hasStoredTheme = true;
  applyTheme(event.newValue, { animate: true });
});

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

const setMenuOpen = (open) => {
  siteNav?.classList.toggle('is-open', open);
  menuToggle?.setAttribute('aria-expanded', String(open));
  menuToggle?.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
};

menuToggle?.addEventListener('click', () => {
  setMenuOpen(!siteNav?.classList.contains('is-open'));
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false);
});

document.addEventListener('click', (event) => {
  if (!siteNav?.classList.contains('is-open')) return;
  if (event.target instanceof Element && event.target.closest('.site-header')) return;
  setMenuOpen(false);
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.site-nav a')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach((section) => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((item) => {
      item.classList.remove('is-selected');
      item.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('is-selected');
    button.setAttribute('aria-pressed', 'true');
    const filter = button.dataset.filter;
    document.querySelectorAll('.project-item').forEach((item) => {
      item.hidden = filter !== 'all' && item.dataset.category !== filter;
    });
  });
});

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
