const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const METING_API_ORIGIN = 'https://api.i-meto.com';
const METING_API_PATH = '/meting/api';
const METING_PLATFORMS = new Set(['netease', 'tencent', 'kugou', 'kuwo', 'baidu']);

export function buildMetingSearchUrl(apiUrl, platform, query) {
  try {
    const url = new URL(apiUrl);
    const server = String(platform ?? '').trim().toLowerCase();
    const term = String(query ?? '').trim();
    if (url.protocol !== 'https:' || url.origin !== METING_API_ORIGIN || url.pathname !== METING_API_PATH) {
      throw new Error('untrusted endpoint');
    }
    if (!METING_PLATFORMS.has(server) || !term || term.length > 40) throw new Error('invalid query');
    url.search = '';
    url.searchParams.set('server', server);
    url.searchParams.set('type', 'search');
    url.searchParams.set('id', term);
    return url.href;
  } catch {
    throw new Error('Invalid hosted Meting API request');
  }
}

export function normalizeMetingApiTracks(payload, { limit = 24 } = {}) {
  if (!Array.isArray(payload)) throw new Error('Invalid hosted Meting API response');
  const maxTracks = Math.min(Math.max(Number(limit) || 24, 1), 24);
  const ids = new Set();
  const tracks = [];

  for (const item of payload) {
    if (tracks.length >= maxTracks) break;
    const title = String(item?.title ?? '').trim();
    const artist = String(item?.author ?? '').trim();
    const rawUrl = String(item?.url ?? '').trim();
    if (!title || !artist || !rawUrl || title.length > 200 || artist.length > 200 || rawUrl.length > 4096) continue;

    try {
      const url = new URL(rawUrl);
      const server = url.searchParams.get('server');
      const sourceId = url.searchParams.get('id');
      if (url.protocol !== 'https:' || url.origin !== METING_API_ORIGIN || url.pathname !== METING_API_PATH) continue;
      if (!METING_PLATFORMS.has(server) || !sourceId || !/^[A-Za-z0-9_-]{1,100}$/.test(sourceId)) continue;
      const id = `${server}:${sourceId}`;
      if (ids.has(id)) continue;

      const artwork = typeof item?.pic === 'string' && item.pic.startsWith(`${METING_API_ORIGIN}${METING_API_PATH}`)
        ? item.pic
        : null;
      ids.add(id);
      tracks.push({ id, title, artist, url: url.href, ...(artwork ? { artwork } : {}) });
    } catch {
      // Ignore malformed third-party results.
    }
  }

  if (tracks.length === 0) throw new Error('Hosted Meting API has no playable tracks');
  return tracks;
}

export function normalizeMetingTracks(payload, { limit = 24 } = {}) {
  if (payload?.version !== 1 || payload?.source !== 'meting' || !Array.isArray(payload.tracks)) {
    throw new Error('Invalid Meting source response');
  }

  const maxTracks = Math.min(Math.max(Number(limit) || 24, 1), 24);
  const ids = new Set();
  const tracks = [];
  for (const item of payload.tracks) {
    if (tracks.length >= maxTracks) break;
    const id = String(item?.id ?? '').trim();
    const title = String(item?.title ?? '').trim();
    const artist = String(item?.artist ?? '').trim();
    const rawUrl = String(item?.url ?? '').trim();
    if (!id || !title || !artist || !rawUrl || ids.has(id)) continue;
    if (id.length > 100 || title.length > 200 || artist.length > 200 || rawUrl.length > 4096) continue;

    let url;
    try {
      url = new URL(rawUrl);
      if (url.protocol !== 'https:' || url.username || url.password) continue;
    } catch {
      continue;
    }

    ids.add(id);
    tracks.push({
      id,
      title,
      artist,
      url: url.href,
      ...(typeof item?.artwork === 'string' && item.artwork.startsWith('https://')
        ? { artwork: item.artwork }
        : {}),
      ...(Number.isFinite(Number(item?.duration)) && Number(item.duration) >= 0
        ? { duration: Number(item.duration) }
        : {}),
    });
  }

  if (tracks.length === 0) throw new Error('Meting source has no playable tracks');
  return tracks;
}

export function isMusicEnabled(hostname, publicEnabled) {
  return Boolean(publicEnabled) || LOCAL_HOSTS.has(hostname);
}

export function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function normalizeStoredVolume(value, fallback = 0.7) {
  if (value === null || value === '') return fallback;
  const volume = Number(value);
  return Number.isFinite(volume) && volume >= 0 && volume <= 1 ? volume : fallback;
}

export function setIconVisible(icon, visible) {
  icon.toggleAttribute('hidden', !visible);
}

const VOLUME_STORAGE_KEY = 'lxt-music-volume';
const TRACK_STORAGE_KEY = 'lxt-music-track';

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Playback remains available when storage is blocked.
  }
}

function initMusicPlayer() {
  const player = document.querySelector('[data-music-player]');
  if (!player) return;

  const sourceType = player.dataset.sourceType || 'self-hosted';
  const manifestUrl = player.dataset.manifestUrl;
  const platform = player.dataset.platform || 'netease';
  const queries = String(player.dataset.queries || '')
    .split(',')
    .map((query) => query.trim())
    .filter((query) => query && query.length <= 40)
    .slice(0, 3);
  const trackLimit = Math.min(Math.max(Number(player.dataset.limit) || 24, 1), 24);
  const publicEnabled = player.dataset.publicEnabled === 'true';
  const launchButtons = [...document.querySelectorAll('[data-music-launch]')];
  const entryStatus = document.querySelector('[data-music-entry-status]');
  const audio = player.querySelector('[data-music-audio]');
  const playButton = player.querySelector('[data-music-play]');
  const previousButton = player.querySelector('[data-music-previous]');
  const nextButton = player.querySelector('[data-music-next]');
  const muteButton = player.querySelector('[data-music-mute]');
  const listButton = player.querySelector('[data-music-list]');
  const minimizeButton = player.querySelector('[data-music-minimize]');
  const retryButton = player.querySelector('[data-music-retry]');
  const playlistPanel = player.querySelector('[data-music-playlist-panel]');
  const playlistElement = player.querySelector('[data-music-playlist]');
  const playlistCount = player.querySelector('[data-playlist-count]');
  const progress = player.querySelector('[data-music-progress]');
  const volume = player.querySelector('[data-music-volume]');
  const title = player.querySelector('[data-track-title]');
  const artist = player.querySelector('[data-track-artist]');
  const currentTime = player.querySelector('[data-current-time]');
  const duration = player.querySelector('[data-duration]');
  const message = player.querySelector('[data-music-message]');
  const messageText = player.querySelector('[data-music-message-text]');
  const playIcon = player.querySelector('[data-play-icon]');
  const pauseIcon = player.querySelector('[data-pause-icon]');
  const volumeIcon = player.querySelector('[data-volume-icon]');
  const mutedIcon = player.querySelector('[data-muted-icon]');

  let tracks = [];
  let currentIndex = 0;
  let loadState = 'idle';
  let retryAction = null;

  const setEntryState = (label, { disabled = false, titleText = label } = {}) => {
    if (entryStatus) entryStatus.textContent = label;
    launchButtons.forEach((button) => {
      button.disabled = disabled;
      button.title = titleText;
      button.setAttribute('aria-label', titleText);
    });
  };

  const setMessage = (text = '', { retry = null } = {}) => {
    retryAction = retry;
    message.hidden = !text;
    messageText.textContent = text;
    retryButton.hidden = !retry;
  };

  const setPlayerOpen = (open) => {
    player.hidden = !open;
    const label = open ? '收起音乐播放器' : '打开音乐播放器';
    launchButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(open));
      button.setAttribute('aria-label', label);
      button.title = label;
    });
    if (!open) {
      playlistPanel.hidden = true;
      listButton.setAttribute('aria-expanded', 'false');
      listButton.setAttribute('aria-label', '打开播放列表');
    }
  };

  const updatePlayingState = () => {
    const playing = !audio.paused && !audio.ended;
    setIconVisible(playIcon, !playing);
    setIconVisible(pauseIcon, playing);
    playButton.classList.toggle('is-playing', playing);
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.setAttribute('aria-label', playing ? '暂停' : '播放');
    playButton.title = playing ? '暂停' : '播放';
    launchButtons.forEach((button) => button.classList.toggle('is-playing', playing));
  };

  const updateMuteState = () => {
    const muted = audio.muted || audio.volume === 0;
    setIconVisible(volumeIcon, !muted);
    setIconVisible(mutedIcon, muted);
    muteButton.setAttribute('aria-label', muted ? '取消静音' : '静音');
    muteButton.title = muted ? '取消静音' : '静音';
  };

  const updatePlaylistSelection = () => {
    playlistElement.querySelectorAll('button').forEach((button, index) => {
      if (index === currentIndex) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    previousButton.disabled = tracks.length <= 1 || currentIndex === 0;
    nextButton.disabled = tracks.length <= 1 || currentIndex === tracks.length - 1;
  };

  const selectTrack = (index) => {
    const track = tracks[index];
    if (!track) return;
    audio.pause();
    currentIndex = index;
    audio.src = track.url;
    audio.load();
    title.textContent = track.title;
    artist.textContent = track.artist;
    currentTime.textContent = '0:00';
    duration.textContent = '0:00';
    progress.max = '0';
    progress.value = '0';
    writeStorage(TRACK_STORAGE_KEY, track.id);
    updatePlaylistSelection();
    updatePlayingState();
    setMessage();
  };

  const attemptPlay = async () => {
    if (!tracks.length) return;
    setMessage();
    try {
      await audio.play();
    } catch {
      setMessage('浏览器阻止了播放，请再次点击播放按钮。');
      updatePlayingState();
    }
  };

  const renderPlaylist = () => {
    playlistElement.replaceChildren();
    tracks.forEach((track, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      const number = document.createElement('span');
      const name = document.createElement('span');
      const byline = document.createElement('span');

      button.type = 'button';
      button.dataset.trackIndex = String(index);
      number.className = 'music-playlist-index';
      number.textContent = String(index + 1).padStart(2, '0');
      name.className = 'music-playlist-title';
      name.textContent = track.title;
      byline.className = 'music-playlist-artist';
      byline.textContent = track.artist;
      button.append(number, name, byline);
      button.addEventListener('click', () => {
        const wasPlaying = !audio.paused;
        selectTrack(index);
        if (wasPlaying) attemptPlay();
      });
      item.append(button);
      playlistElement.append(item);
    });
    playlistCount.textContent = `${tracks.length} 首`;
  };

  const loadPlaylist = async () => {
    if (!manifestUrl || loadState === 'loading') return;
    loadState = 'loading';
    setEntryState('加载中', { disabled: true, titleText: '音乐播放器加载中' });

    try {
      if (sourceType === 'hosted-meting') {
        if (queries.length === 0) throw new Error('No Meting search queries configured');
        const perQueryLimit = Math.max(1, Math.ceil(trackLimit / queries.length));
        const payloads = await Promise.all(queries.map(async (query) => {
          const searchUrl = buildMetingSearchUrl(manifestUrl, platform, query);
          const response = await fetch(searchUrl, { cache: 'no-store' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const payload = await response.json();
          if (!Array.isArray(payload)) throw new Error('Invalid hosted Meting API response');
          return payload.slice(0, perQueryLimit);
        }));
        tracks = normalizeMetingApiTracks(payloads.flat(), { limit: trackLimit });
      } else {
        const response = await fetch(manifestUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        tracks = normalizeMetingTracks(await response.json(), { limit: trackLimit });
      }
      renderPlaylist();
      const storedTrack = readStorage(TRACK_STORAGE_KEY);
      const storedIndex = tracks.findIndex((track) => track.id === storedTrack);
      selectTrack(storedIndex >= 0 ? storedIndex : 0);
      loadState = 'ready';
      setEntryState(`${tracks.length} 首可播放`, { titleText: '打开音乐播放器' });
    } catch {
      loadState = 'error';
      setEntryState('加载失败 · 点击重试', { titleText: '重新加载音乐播放器' });
    }
  };

  launchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (loadState === 'error') {
        loadPlaylist();
        return;
      }
      if (loadState !== 'ready') return;
      setPlayerOpen(player.hidden);
      if (!player.hidden) playButton.focus({ preventScroll: true });
    });
  });

  playButton.addEventListener('click', () => (audio.paused ? attemptPlay() : audio.pause()));
  previousButton.addEventListener('click', () => {
    const wasPlaying = !audio.paused;
    if (audio.currentTime > 3) audio.currentTime = 0;
    else if (currentIndex > 0) selectTrack(currentIndex - 1);
    if (wasPlaying) attemptPlay();
  });
  nextButton.addEventListener('click', () => {
    const wasPlaying = !audio.paused;
    if (currentIndex < tracks.length - 1) selectTrack(currentIndex + 1);
    if (wasPlaying) attemptPlay();
  });
  minimizeButton.addEventListener('click', () => setPlayerOpen(false));
  listButton.addEventListener('click', () => {
    const open = playlistPanel.hidden;
    playlistPanel.hidden = !open;
    listButton.setAttribute('aria-expanded', String(open));
    listButton.setAttribute('aria-label', open ? '关闭播放列表' : '打开播放列表');
  });
  retryButton.addEventListener('click', () => retryAction?.());

  progress.addEventListener('input', () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(progress.value);
  });
  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    audio.muted = false;
  });
  muteButton.addEventListener('click', () => {
    audio.muted = !audio.muted;
  });

  audio.addEventListener('loadedmetadata', () => {
    progress.max = String(audio.duration || 0);
    duration.textContent = formatTime(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    progress.value = String(audio.currentTime);
    currentTime.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener('play', () => {
    setMessage();
    updatePlayingState();
  });
  audio.addEventListener('pause', updatePlayingState);
  audio.addEventListener('waiting', () => setMessage('正在缓冲音乐…'));
  audio.addEventListener('canplay', () => setMessage());
  audio.addEventListener('volumechange', () => {
    volume.value = String(audio.volume);
    writeStorage(VOLUME_STORAGE_KEY, String(audio.volume));
    updateMuteState();
  });
  audio.addEventListener('error', () => {
    setMessage('音频加载失败，请检查网络后重试。', {
      retry: () => {
        audio.load();
        attemptPlay();
      },
    });
    updatePlayingState();
  });
  audio.addEventListener('ended', () => {
    if (currentIndex < tracks.length - 1) {
      selectTrack(currentIndex + 1);
      attemptPlay();
    } else {
      audio.currentTime = 0;
      updatePlayingState();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || playlistPanel.hidden) return;
    playlistPanel.hidden = true;
    listButton.setAttribute('aria-expanded', 'false');
    listButton.setAttribute('aria-label', '打开播放列表');
    listButton.focus();
  });

  audio.volume = normalizeStoredVolume(readStorage(VOLUME_STORAGE_KEY));
  volume.value = String(audio.volume);
  updateMuteState();
  updatePlayingState();

  if (!isMusicEnabled(window.location.hostname, publicEnabled)) {
    loadState = 'disabled';
    setEntryState('授权确认后开放', { disabled: true, titleText: '音乐授权确认后开放' });
    return;
  }

  loadPlaylist();
}

if (typeof document !== 'undefined') initMusicPlayer();
