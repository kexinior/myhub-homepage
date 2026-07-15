import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizePlatform,
  normalizeQueryTerms,
  normalizeMetingResults,
  toHttpsStreamUrl,
} from '../music-server.mjs';

test('normalizeQueryTerms limits and trims search terms', () => {
  assert.deepEqual(normalizeQueryTerms(' 周杰伦, 林俊杰 , 古风 , extra '), ['周杰伦', '林俊杰', '古风']);
  assert.deepEqual(normalizeQueryTerms(''), ['周杰伦', '林俊杰', '古风']);
});

test('normalizePlatform only accepts supported Meting providers', () => {
  assert.equal(normalizePlatform('tencent'), 'tencent');
  assert.equal(normalizePlatform('unknown'), 'netease');
});

test('toHttpsStreamUrl upgrades platform http URLs and rejects credentials', () => {
  assert.equal(toHttpsStreamUrl('http://cdn.example.test/song.mp3'), 'https://cdn.example.test/song.mp3');
  assert.equal(toHttpsStreamUrl('javascript:alert(1)'), null);
  assert.equal(toHttpsStreamUrl('https://user:pass@example.test/song.mp3'), null);
});

test('normalizeMetingResults returns the player contract and removes duplicates', () => {
  assert.deepEqual(normalizeMetingResults([
    { id: 1, name: '晴天', artist: ['周杰伦'], url: 'http://cdn.example.test/one.mp3' },
    { id: 1, name: '重复', artist: ['周杰伦'], url: 'https://cdn.example.test/two.mp3' },
    { id: 2, name: '江南', artist: ['林俊杰', '乐队'], url: 'https://cdn.example.test/three.mp3' },
  ]), [
    { id: '1', title: '晴天', artist: '周杰伦', url: 'https://cdn.example.test/one.mp3' },
    { id: '2', title: '江南', artist: '林俊杰 / 乐队', url: 'https://cdn.example.test/three.mp3' },
  ]);
});
