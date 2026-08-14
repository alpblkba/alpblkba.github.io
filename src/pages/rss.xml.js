import site from '../data/site.js';

const SITE_URL = 'https://alpblkba.dev';

function parseDate(d) {
  const [day, month, year] = d.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const items = site.notes
    .slice()
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))
    .map(
      (n) => `
    <item>
      <title>${escapeXml(n.title)}</title>
      <link>${SITE_URL}/notes/${n.slug}</link>
      <guid>${SITE_URL}/notes/${n.slug}</guid>
      <pubDate>${parseDate(n.date).toUTCString()}</pubDate>
      <category>${escapeXml(n.tag)}</category>
    </item>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.identity.name)} — notes</title>
    <link>${SITE_URL}/notes</link>
    <description>${escapeXml(site.identity.tagline)}</description>
    <language>en</language>${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}
