async function getLatestPosts(n = 3) {
  try {
    const res   = await fetch('/blog/index.xml');
    const text  = await res.text();
    const xml   = new DOMParser().parseFromString(text, 'application/xml');
    const items = Array.from(xml.querySelectorAll('item')).slice(0, n);

    return items.map(item => ({
      title:   item.querySelector('title')?.textContent   || '',
      pubDate: item.querySelector('pubDate')?.textContent || '',
      summary: item.querySelector('description')?.textContent || '',
      link:    item.querySelector('link')?.textContent    || '',
    }));
  } catch (err) {
    console.error('Error fetching or parsing RSS:', err);
    return [];
  }
}

async function getBsanPosts() {
  try {
    const res = await fetch('https://borrowsanitizer.com/rss.xml');
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    const items = Array.from(xml.querySelectorAll('item'));

    return items
      .filter(item => (item.querySelector('guid')?.textContent || '').includes('/status/'))
      .map(item => {
        const rawTitle = item.querySelector('title')?.textContent || '';
        const title = 'BorrowSanitizer Update: <strong>' + rawTitle
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ') + '</strong>';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        return { title, link, pubDate };
      });
  } catch (err) {
    console.error('Error fetching BorrowSanitizer RSS:', err);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('latest-posts');
  if (!container) return;

  const [blogPosts, bsPosts] = await Promise.all([getLatestPosts(10), getBsanPosts()]);

  const combined = [...blogPosts, ...bsPosts]
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 3);

  combined.forEach(post => {
    const article = document.createElement('article');
    article.className = 'latest-post';
    const date = new Date(post.pubDate).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    const isExternal = post.link.startsWith('http');
    article.innerHTML = `
    <a class="box button title blog" href="${post.link}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>
        <h4>${post.title}</h4>
        <time datetime="${post.pubDate}">${date}</time>
        ${post.summary ? `<p>${post.summary}</p>` : ''}
    </a>
    `;
    container.appendChild(article);
  });
});


const sidebar = document.getElementById('sidebar');
const home = document.getElementById('home');
const research = document.getElementById('research');
let lastMouseX = null;
let isInLeftZone = false;

function isOverSidebar(x) {
    if (x === null) return false;
    return x >= sidebar.offsetLeft && x < sidebar.offsetLeft + sidebar.offsetWidth;
}

function updateSidebarVisibility() {
    const researchRect = research.getBoundingClientRect();
    const researchAtTop = researchRect.top <= 0;

    isInLeftZone = isOverSidebar(lastMouseX);

    if (!researchAtTop || isInLeftZone) {
        sidebar.classList.remove('closed');
        home.classList.remove('closed');
    } else {
        sidebar.classList.add('closed');
        home.classList.add('closed');
    }
}

// Mouse hover sidebar
document.addEventListener('mousemove', function(event) {
    lastMouseX = event.clientX;

    if (isOverSidebar(lastMouseX) !== isInLeftZone) {
        updateSidebarVisibility();
    }
});

// Scroll sidebar
document.addEventListener('scroll', function() {
    updateSidebarVisibility();
});

// Music widget
document.addEventListener('DOMContentLoaded', async () => {
  key = "d02f17dfd561418c9a45e4c62436c5b9" //lol
  const music = document.getElementById('music');
  const song = document.getElementById('song');
  try {
        fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=mojeanmac&api_key=${key}&format=json&limit=1`)
        .then(response => response.json())
        .then(data => {
          const track = data.recenttracks.track[0];
          const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === "true";
          const songName = track.name;
          const artistName = track.artist['#text'];
          const text = `${artistName} - ${songName}`;
          song.textContent = text;
          if (text.length > 32) {
            song.style.animation = 'marquee-content 8s linear infinite';
          }
          if (isNowPlaying) {
            music.classList.add('show');
            home.classList.add('show');
          }
        });
  } catch (error) {
      console.error('Error fetching LastFM data:', error);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetch(`https://api.github.com/repos/mojeanmac/mojeanmac.github.io`).then(r => r.json());
  const days = Math.floor((Date.now() - new Date(data.pushed_at)) / 86400000);
  text = `(last updated ${days} day${days !== 1 ? 's' : ''} ago)`;
  document.getElementById('lastUpdated').textContent = text;
});
// WRCT archive player: streams the most recent Thursday 3pm show from Spinitron's Ark
document.addEventListener('DOMContentLoaded', async () => {
  const STATION = 'WRCT';
  const TZ = 'America/New_York';
  const WEEKDAY = 4;                  // Thursday
  const START_HOUR = 15;              // 3pm local
  const LENGTH = 60 * 60;             // one hour show
  const ARK = 'https://ark3.spinitron.com/ark2';
  const HLSJS = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.4';

  const box = document.getElementById('ark');
  if (!box) return;

  const playBtn = document.getElementById('arkplay');
  const muteBtn = document.getElementById('arkmute');
  const volume = document.getElementById('arkvolume');
  const seek = document.getElementById('arkseek');
  const clock = document.getElementById('arktime');
  const dateLabel = document.getElementById('arkdate');

  // milliseconds a timezone is ahead of UTC at a given instant
  function offset(ms, tz) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(ms));
    const f = Object.fromEntries(parts.map(p => [p.type, Number(p.value)]));
    return Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second) - ms;
  }

  // the UTC instant of a wall-clock time in tz (iterate once to settle DST)
  function instant(year, month, day, hour, tz) {
    const wall = Date.UTC(year, month - 1, day, hour);
    let ms = wall - offset(wall, tz);
    return wall - offset(ms, tz);
  }

  function stamp(ms) {
    return new Date(ms).toISOString().replace(/[-:]|\.\d+/g, '');
  }

  // most recent Thursday 3pm that has already finished airing
  function latestAirtime() {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date()).split('-').map(Number);

    for (let back = 0; back < 14; back++) {
      const day = new Date(Date.UTC(today[0], today[1] - 1, today[2] - back));
      if (day.getUTCDay() !== WEEKDAY) continue;
      const start = instant(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), START_HOUR, TZ);
      if (start + LENGTH * 1000 <= Date.now()) return start;
    }
    return null;
  }

  // the archive keeps about two weeks, so the latest airing is always in range.
  // no need to check up front: ark3 rate limits hard and its error pages carry
  // no CORS headers, so probing costs requests and fails opaquely.
  const airtime = latestAirtime();
  if (airtime === null) return;
  const source = `${ARK}/${STATION}-${stamp(airtime)}/index.m3u8`;

  dateLabel.textContent = new Date(airtime).toLocaleDateString(undefined, {
    timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric',
  });
  box.hidden = false;

  function unavailable(err) {
    console.error('Ark playback failed:', err);
    dateLabel.textContent = 'archive unavailable';
    playBtn.disabled = true;
    audio.pause();
  }

  const audio = new Audio();
  audio.preload = 'none';
  let attached = false;

  function load(script) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = script;
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  async function attach() {
    if (attached) return;
    attached = true;
    if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = source;             // Safari plays HLS natively
      audio.addEventListener('error', () => unavailable(audio.error));
      return;
    }
    await load(HLSJS).catch(unavailable);
    if (typeof Hls === 'undefined') return;
    const hls = new Hls();
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) unavailable(data.details);
    });
    hls.loadSource(source);
    hls.attachMedia(audio);
  }

  function time(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  playBtn.addEventListener('click', async () => {
    if (audio.paused) {
      await attach();
      audio.play().catch(err => console.error('Ark playback failed:', err));
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => {
    playBtn.classList.add('playing');
    playBtn.setAttribute('aria-label', 'Pause');
  });

  audio.addEventListener('pause', () => {
    playBtn.classList.remove('playing');
    playBtn.setAttribute('aria-label', 'Play');
  });

  function showVolume() {
    const off = audio.muted || audio.volume === 0;
    muteBtn.classList.toggle('muted-on', off);
    muteBtn.setAttribute('aria-label', off ? 'Unmute' : 'Mute');
    volume.value = off ? 0 : Math.round(audio.volume * 100);
  }

  muteBtn.addEventListener('click', () => {
    audio.muted = !(audio.muted || audio.volume === 0);
    if (!audio.muted && audio.volume === 0) audio.volume = 1;
    showVolume();
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value) / 100;
    audio.muted = false;      // dragging to zero reads as muted on its own
    showVolume();
  });

  audio.addEventListener('timeupdate', () => {
    // the archive stream runs past the end of the show, so stop on the hour
    if (audio.currentTime >= LENGTH) {
      audio.pause();
      audio.currentTime = 0;
    }
    seek.value = Math.min(audio.currentTime, LENGTH);
    clock.textContent = time(seek.value);
  });

  seek.addEventListener('input', async () => {
    await attach();
    audio.currentTime = Number(seek.value);
    clock.textContent = time(seek.value);
  });
});
