/**
 * Fetches your site’s RSS feed, pulls out the latest `n` items,
 * and returns an array of objects { title, pubDate, tags, summary, link }.
 */
async function getLatestPosts(n = 3) {
  try {
    const res   = await fetch('/blog/public/index.xml');
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
