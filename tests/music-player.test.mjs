import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatTime,
  isMusicEnabled,
  normalizeStoredVolume,
  normalizeMetingTracks,
  setIconVisible,
} from '../music-player.mjs';

test('normalizeMetingTracks accepts the server playlist contract', () => {
  const tracks = normalizeMetingTracks({
    version: 1,
    source: 'meting',
    tracks: [
      {
        id: '186016',
        title: '晴天',
        artist: '周杰伦',
        url: 'https://music.example.test/track.mp3',
        duration: 269,
      },
    ],
  });

  assert.deepEqual(tracks, [
    {
      id: '186016',
      title: '晴天',
      artist: '周杰伦',
      url: 'https://music.example.test/track.mp3',
      duration: 269,
    },
  ]);
});

test('normalizeMetingTracks rejects unsafe media URLs and malformed payloads', () => {
  assert.throws(() => normalizeMetingTracks({ version: 1, source: 'other', tracks: [] }), /Meting/);
  assert.throws(() => normalizeMetingTracks({
    version: 1,
    source: 'meting',
    tracks: [{ id: 'bad', title: 'Bad', artist: 'Test', url: 'http://example.test/track.mp3' }],
  }), /Meting/);
});

test('isMusicEnabled keeps public hosts disabled while allowing local preview', () => {
  assert.equal(isMusicEnabled('127.0.0.1', false), true);
  assert.equal(isMusicEnabled('localhost', false), true);
  assert.equal(isMusicEnabled('kexinior.github.io', false), false);
  assert.equal(isMusicEnabled('kexinior.github.io', true), true);
});

test('formatTime renders media durations without leaking invalid values', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(Number.NaN), '0:00');
});

test('normalizeStoredVolume distinguishes an absent value from an explicit zero', () => {
  assert.equal(normalizeStoredVolume(null), 0.7);
  assert.equal(normalizeStoredVolume(''), 0.7);
  assert.equal(normalizeStoredVolume('0'), 0);
  assert.equal(normalizeStoredVolume('0.45'), 0.45);
  assert.equal(normalizeStoredVolume('2'), 0.7);
});

test('setIconVisible toggles the hidden attribute for SVG-compatible icons', () => {
  const attributes = new Set(['hidden']);
  const icon = {
    toggleAttribute(name, force) {
      if (force) attributes.add(name);
      else attributes.delete(name);
    },
  };

  setIconVisible(icon, true);
  assert.equal(attributes.has('hidden'), false);
  setIconVisible(icon, false);
  assert.equal(attributes.has('hidden'), true);
});
