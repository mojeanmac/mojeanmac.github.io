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

document.addEventListener('DOMContentLoaded', async () => {
  const posts = await getLatestPosts(3);
  const container = document.getElementById('latest-posts');

  if (!container) return;

  posts.forEach(post => {
    // build each post block
    const article = document.createElement('article');
    article.className = 'latest-post';

    // format date
    const date = new Date(post.pubDate).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    article.innerHTML = `
    <a href="${post.link}">
        <div class="box button title blog">
            <h4>${post.title}</h4>
            <time datetime="${post.pubDate}">${date}</time>
            <p>${post.summary}</p>
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
    const leftThreshold = window.innerWidth * 0.3;
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
          if (isNowPlaying) {
            music.style.display = 'block';
          } else {
            return;
          }

          const songName = track.name;
          const artistName = track.artist['#text'];
          const text = `${artistName} - ${songName}`;
          song.textContent = text;
          if (text.length > 25) {
          // Needs scrolling - duplicate for seamless loop
            song.style.animation = 'marquee-content 8s linear infinite';
          } else {
          // Fits without scrolling
            song.style.animation = 'none';
            song.style.paddingLeft = '0'; // Reset padding since no scroll needed
          }
        });
  } catch (error) {
      console.error('Error fetching LastFM data:', error);
  }
});