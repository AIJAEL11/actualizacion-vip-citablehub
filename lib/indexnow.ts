/**
 * IndexNow integration — instant URL submission to Bing, Yandex, Naver, Seznam, etc.
 * Docs: https://www.indexnow.org/documentation
 */

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITE_HOST = 'citablehub.com';
const SITE_URL = 'https://citablehub.com';

/**
 * Notify IndexNow that one or more URLs have been created or updated.
 * Fire-and-forget — errors are logged but never thrown.
 *
 * @param urls  Absolute URLs or paths (e.g. "/p/linear").
 *              Paths are automatically prefixed with the site URL.
 */
export async function notifyIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.warn('[IndexNow] INDEXNOW_KEY not set — skipping notification');
    return;
  }

  // Normalize: ensure absolute URLs
  const absoluteUrls = urls.map((u) =>
    u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`
  );

  if (absoluteUrls.length === 0) return;

  try {
    // IndexNow supports batch via POST with urlList
    const payload = {
      host: SITE_HOST,
      key,
      keyLocation: `${SITE_URL}/${key}.txt`,
      urlList: absoluteUrls.slice(0, 10000), // API max 10k URLs per request
    };

    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] ✅ Submitted ${absoluteUrls.length} URL(s) — status ${res.status}`);
    } else {
      const text = await res.text().catch(() => '');
      console.error(`[IndexNow] ❌ Failed (${res.status}): ${text}`);
    }
  } catch (err: any) {
    console.error('[IndexNow] ❌ Network error:', err?.message || err);
  }
}

/**
 * Convenience: notify IndexNow about a single project profile URL.
 */
export async function notifyProjectChange(slug: string): Promise<void> {
  await notifyIndexNow([`/p/${slug}`]);
}
