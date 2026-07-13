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

const hero = document.querySelector('#top');
const sakuraLayer = hero?.querySelector('.sakura-layer');
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const mobileViewport = window.matchMedia?.('(max-width: 768px)');
let heroVisible = false;
let sakuraTimer = null;

const randomBetween = (min, max) => min + Math.random() * (max - min);

const getSakuraLimit = () => (mobileViewport?.matches ? 8 : 14);

const clearSakura = () => {
  if (!sakuraLayer) return;
  while (sakuraLayer.firstChild) sakuraLayer.firstChild.remove();
};

const createPetal = ({ seeded = false } = {}) => {
  if (!sakuraLayer || !heroVisible || document.hidden || reducedMotion?.matches) return;
  if (sakuraLayer.childElementCount >= getSakuraLimit()) return;

  const petal = document.createElement('span');
  const duration = randomBetween(8, 14);
  const seededDelay = seeded ? -randomBetween(1.5, duration - 1) : 0;
  const size = mobileViewport?.matches ? randomBetween(7, 12) : randomBetween(8, 16);

  petal.className = 'sakura-petal';
  petal.style.setProperty('--petal-left', `${randomBetween(0, 100)}%`);
  petal.style.setProperty('--petal-size', `${size.toFixed(2)}px`);
  petal.style.setProperty('--petal-duration', `${duration.toFixed(2)}s`);
  petal.style.setProperty('--petal-delay', `${seededDelay.toFixed(2)}s`);
  petal.style.setProperty('--petal-opacity', randomBetween(0.35, 0.75).toFixed(2));
  petal.style.setProperty('--petal-drift', `${randomBetween(-90, 110).toFixed(1)}px`);
  petal.style.setProperty('--petal-spin', `${randomBetween(180, 720).toFixed(1)}deg`);
  petal.style.setProperty('--petal-blur', `${randomBetween(0, 0.45).toFixed(2)}px`);
  petal.style.setProperty('--fall-distance', `${sakuraLayer.clientHeight + 70}px`);
  petal.addEventListener('animationend', () => petal.remove(), { once: true });
  sakuraLayer.append(petal);
};

const scheduleNextPetal = () => {
  if (sakuraTimer !== null || !heroVisible || document.hidden || reducedMotion?.matches) return;
  sakuraTimer = window.setTimeout(() => {
    sakuraTimer = null;
    createPetal();
    scheduleNextPetal();
  }, randomBetween(550, 1150));
};

const stopSakura = () => {
  if (sakuraTimer !== null) {
    window.clearTimeout(sakuraTimer);
    sakuraTimer = null;
  }
  clearSakura();
};

const startSakura = () => {
  if (!sakuraLayer || !heroVisible || document.hidden || reducedMotion?.matches || sakuraTimer !== null) return;
  const seedCount = mobileViewport?.matches ? 3 : 4;
  for (let index = 0; index < seedCount; index += 1) createPetal({ seeded: true });
  scheduleNextPetal();
};

if (hero && sakuraLayer && 'IntersectionObserver' in window) {
  const sakuraObserver = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    if (heroVisible) startSakura();
    else stopSakura();
  }, { threshold: 0.05 });
  sakuraObserver.observe(hero);
} else if (hero && sakuraLayer) {
  heroVisible = true;
  startSakura();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSakura();
  else if (heroVisible) startSakura();
});

const handleReducedMotionChange = () => {
  if (reducedMotion?.matches) stopSakura();
  else if (heroVisible) startSakura();
};

if (reducedMotion?.addEventListener) reducedMotion.addEventListener('change', handleReducedMotionChange);
else reducedMotion?.addListener?.(handleReducedMotionChange);

const handleViewportDensityChange = () => {
  if (!heroVisible || reducedMotion?.matches) return;
  stopSakura();
  startSakura();
};

if (mobileViewport?.addEventListener) mobileViewport.addEventListener('change', handleViewportDensityChange);
else mobileViewport?.addListener?.(handleViewportDensityChange);

const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
