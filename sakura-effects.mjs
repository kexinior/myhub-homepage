const MOBILE_BREAKPOINT = 768;

export function getSakuraSettings(viewportWidth) {
  const isMobile = viewportWidth <= MOBILE_BREAKPOINT;

  return isMobile
    ? {
        isMobile: true,
        fallingLimit: 14,
        totalLimit: 26,
        seedCount: 4,
        burstCount: 7,
        sizeMin: 10,
        sizeMax: 18,
      }
    : {
        isMobile: false,
        fallingLimit: 24,
        totalLimit: 42,
        seedCount: 6,
        burstCount: 10,
        sizeMin: 12,
        sizeMax: 24,
      };
}

export function createBurstVectors(count, random = Math.random) {
  return Array.from({ length: count }, (_, index) => {
    const angle = ((Math.PI * 2) / count) * index + (random() - 0.5) * 0.35;
    const distance = 70 + random() * 80;

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      distance,
      duration: 650 + random() * 450,
      scale: 0.7 + random() * 0.55,
      spin: (random() < 0.5 ? -1 : 1) * (220 + random() * 500),
    };
  });
}

export function getBurstOrigin(clientX, clientY) {
  return { x: clientX, y: clientY };
}

const randomBetween = (min, max) => min + Math.random() * (max - min);
const interactiveSelector = 'a, button, input, select, textarea, summary, [role="button"], [contenteditable="true"], .music-player';

function initSakuraEffects() {
  const layer = document.querySelector('.sakura-layer');
  if (!layer) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileViewport = window.matchMedia('(max-width: 768px)');
  let timer = null;

  const settings = () => getSakuraSettings(window.innerWidth);
  const canAnimate = () => !document.hidden && !reducedMotion.matches;
  const clearPetals = () => layer.replaceChildren();

  const addFallingPetal = ({ seeded = false } = {}) => {
    const config = settings();
    if (!canAnimate()) return;
    if (layer.querySelectorAll('.sakura-petal--falling').length >= config.fallingLimit) return;
    if (layer.childElementCount >= config.totalLimit) return;

    const petal = document.createElement('span');
    const duration = randomBetween(8, 14);
    const seededDelay = seeded ? -randomBetween(1.5, duration - 1) : 0;

    petal.className = 'sakura-petal sakura-petal--falling';
    petal.style.setProperty('--petal-left', `${randomBetween(0, 100)}%`);
    petal.style.setProperty('--petal-size', `${randomBetween(config.sizeMin, config.sizeMax).toFixed(2)}px`);
    petal.style.setProperty('--petal-duration', `${duration.toFixed(2)}s`);
    petal.style.setProperty('--petal-delay', `${seededDelay.toFixed(2)}s`);
    petal.style.setProperty('--petal-opacity', randomBetween(0.42, 0.82).toFixed(2));
    petal.style.setProperty('--petal-drift', `${randomBetween(-120, 140).toFixed(1)}px`);
    petal.style.setProperty('--petal-spin', `${randomBetween(240, 820).toFixed(1)}deg`);
    petal.style.setProperty('--petal-blur', `${randomBetween(0, 0.55).toFixed(2)}px`);
    petal.style.setProperty('--fall-distance', `${layer.clientHeight + 90}px`);
    petal.addEventListener('animationend', () => petal.remove(), { once: true });
    layer.append(petal);
  };

  const scheduleNextPetal = () => {
    if (timer !== null || !canAnimate()) return;
    timer = window.setTimeout(() => {
      timer = null;
      addFallingPetal();
      scheduleNextPetal();
    }, randomBetween(350, 750));
  };

  const stop = () => {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    clearPetals();
  };

  const start = () => {
    if (!canAnimate() || timer !== null) return;
    for (let index = 0; index < settings().seedCount; index += 1) addFallingPetal({ seeded: true });
    scheduleNextPetal();
  };

  const burstAt = (clientX, clientY) => {
    const config = settings();
    const origin = getBurstOrigin(clientX, clientY);

    createBurstVectors(config.burstCount).forEach((vector) => {
      if (layer.childElementCount >= config.totalLimit) return;
      const petal = document.createElement('span');
      petal.className = 'sakura-petal sakura-petal--burst';
      petal.style.setProperty('--burst-left', `${origin.x.toFixed(1)}px`);
      petal.style.setProperty('--burst-top', `${origin.y.toFixed(1)}px`);
      petal.style.setProperty('--burst-x', `${vector.x.toFixed(1)}px`);
      petal.style.setProperty('--burst-y', `${vector.y.toFixed(1)}px`);
      petal.style.setProperty('--burst-duration', `${vector.duration.toFixed(0)}ms`);
      petal.style.setProperty('--burst-spin', `${vector.spin.toFixed(1)}deg`);
      petal.style.setProperty('--burst-scale', vector.scale.toFixed(2));
      petal.style.setProperty('--petal-size', `${randomBetween(config.sizeMin * 0.72, config.sizeMax * 0.95).toFixed(2)}px`);
      petal.style.setProperty('--petal-blur', `${randomBetween(0, 0.35).toFixed(2)}px`);
      petal.addEventListener('animationend', () => petal.remove(), { once: true });
      layer.append(petal);
    });
  };

  document.addEventListener('pointerdown', (event) => {
    if (!canAnimate() || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (event.target instanceof Element && event.target.closest(interactiveSelector)) return;
    burstAt(event.clientX, event.clientY);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  const handleMotionChange = () => (reducedMotion.matches ? stop() : start());
  const handleViewportChange = () => {
    if (reducedMotion.matches) return;
    stop();
    start();
  };

  reducedMotion.addEventListener?.('change', handleMotionChange);
  mobileViewport.addEventListener?.('change', handleViewportChange);
  start();
}

if (typeof document !== 'undefined') initSakuraEffects();
