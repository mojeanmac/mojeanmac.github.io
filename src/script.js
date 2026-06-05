/**
 * Fetches your site’s RSS feed, pulls out the latest `n` items,
 * and returns an array of objects { title, pubDate, tags, summary, link }.
 */
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
        const relativePath = item.querySelector('link')?.textContent || '';
        const link = 'https://borrowsanitizer.com' + relativePath;
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
    <a href="${post.link}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>
        <div class="box button title blog">
            <h4>${post.title}</h4>
            <time datetime="${post.pubDate}">${date}</time>
            ${post.summary ? `<p>${post.summary}</p>` : ''}
        </div>
    </a>
    `;
    container.appendChild(article);
  });
});


const sidebar = document.getElementById('sidebar');
const home = document.getElementById('home');
const research = document.getElementById('research');
let isInLeftZone = false;

function updateSidebarVisibility() {
    const researchRect = research.getBoundingClientRect();
    const researchAtTop = researchRect.top <= 0;
    
    if (!researchAtTop) {
        sidebar.classList.remove('closed');
        home.classList.remove('closed');
    } else {
        if (isInLeftZone) {
            sidebar.classList.remove('closed');
            home.classList.remove('closed');
        } else {
            sidebar.classList.add('closed');
            home.classList.add('closed');
        }
    }
}

// Mouse hover sidebar
document.addEventListener('mousemove', function(event) {
    const leftThreshold = window.innerWidth * 0.2;
    const nowInLeftZone = event.clientX <= leftThreshold;
    
    if (nowInLeftZone !== isInLeftZone) {
        isInLeftZone = nowInLeftZone;
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
  text = `last updated ${days} day${days !== 1 ? 's' : ''} ago`;
  document.getElementById('lastUpdated').textContent = text;
});