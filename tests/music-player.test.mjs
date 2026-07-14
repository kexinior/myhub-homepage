import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatTime,
  isMusicEnabled,
  normalizeStoredVolume,
  normalizePlaylist,
  resolveTrackSource,
} from '../music-player.mjs';

test('normalizePlaylist accepts the documented playlist contract', () => {
  const tracks = normalizePlaylist({
    version: 1,
    tracks: [
      {
        id: 'meet-157',
        title: '遇见',
        artist: '孙燕姿',
        src: './157 孙燕姿-遇见.mp3',
      },
    ],
  });

  assert.deepEqual(tracks, [
    {
      id: 'meet-157',
      title: '遇见',
      artist: '孙燕姿',
      src: './157 孙燕姿-遇见.mp3',
    },
  ]);
});

test('normalizePlaylist rejects missing and duplicate track identifiers', () => {
  assert.throws(
    () => normalizePlaylist({ version: 1, tracks: [{ title: '无编号', artist: '测试', src: './test.mp3' }] }),
    /播放清单格式无效/,
  );

  assert.throws(
    () => normalizePlaylist({
      version: 1,
      tracks: [
        { id: 'same', title: '第一首', artist: '测试', src: './one.mp3' },
        { id: 'same', title: '第二首', artist: '测试', src: './two.mp3' },
      ],
    }),
    /播放清单格式无效/,
  );
});

test('resolveTrackSource resolves unicode relative paths against the manifest URL', () => {
  const source = resolveTrackSource(
    './157 孙燕姿-遇见.mp3',
    'https://raw.githubusercontent.com/kexinior/my-music/main/playlist.json',
  );

  assert.equal(
    source,
    'https://raw.githubusercontent.com/kexinior/my-music/main/157%20%E5%AD%99%E7%87%95%E5%A7%BF-%E9%81%87%E8%A7%81.mp3',
  );
});

test('resolveTrackSource rejects unsafe and cross-origin media URLs', () => {
  const manifest = 'https://raw.githubusercontent.com/kexinior/my-music/main/playlist.json';
  assert.throws(() => resolveTrackSource('javascript:alert(1)', manifest), /音频地址无效/);
  assert.throws(() => resolveTrackSource('https://example.com/track.mp3', manifest), /音频地址无效/);
});

test('normalizePlaylist rejects unbounded playlists and oversized fields', () => {
  const tracks = Array.from({ length: 101 }, (_, index) => ({
    id: `track-${index}`,
    title: '测试',
    artist: '测试',
    src: `./${index}.mp3`,
  }));
  assert.throws(() => normalizePlaylist({ version: 1, tracks }), /播放清单格式无效/);
  assert.throws(
    () => normalizePlaylist({
      version: 1,
      tracks: [{ id: 'long', title: '歌'.repeat(201), artist: '测试', src: './test.mp3' }],
    }),
    /播放清单格式无效/,
  );
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
