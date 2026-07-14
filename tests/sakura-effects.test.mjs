import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createBurstVectors,
  getSakuraSettings,
} from '../sakura-effects.mjs';

test('desktop sakura settings use larger and denser petals', () => {
  assert.deepEqual(getSakuraSettings(1440), {
    isMobile: false,
    fallingLimit: 24,
    totalLimit: 42,
    seedCount: 6,
    burstCount: 10,
    sizeMin: 12,
    sizeMax: 24,
  });
});

test('mobile sakura settings keep a lower performance budget', () => {
  assert.deepEqual(getSakuraSettings(390), {
    isMobile: true,
    fallingLimit: 14,
    totalLimit: 26,
    seedCount: 4,
    burstCount: 7,
    sizeMin: 10,
    sizeMax: 18,
  });
});

test('createBurstVectors produces a complete radial burst', () => {
  const vectors = createBurstVectors(10, () => 0.5);

  assert.equal(vectors.length, 10);
  assert.ok(vectors.every(({ distance, duration, scale }) => distance >= 70 && distance <= 150 && duration >= 650 && duration <= 1100 && scale >= 0.7 && scale <= 1.25));
  assert.ok(vectors.some(({ x }) => x > 0));
  assert.ok(vectors.some(({ x }) => x < 0));
  assert.ok(vectors.some(({ y }) => y > 0));
  assert.ok(vectors.some(({ y }) => y < 0));
});
