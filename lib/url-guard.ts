/**
 * Basic SSRF guard for endpoints that fetch user-supplied URLs (the public
 * /api/scan tool). Rejects non-http(s) schemes and obvious private/loopback/
 * link-local/metadata hosts. Not a substitute for network-level egress rules,
 * but blocks the common abuse vectors for a public audit tool.
 */
export function isSafePublicUrl(raw: string): { ok: boolean; reason?: string; url?: URL } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'Enter a valid URL (including https://).' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https URLs are supported.' };
  }

  const host = url.hostname.toLowerCase();

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local')
  ) {
    return { ok: false, reason: 'That host is not publicly reachable.' };
  }

  // IPv4 literals in private / loopback / link-local / multicast / reserved ranges.
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const a = parseInt(ipv4[1], 10);
    const b = parseInt(ipv4[2], 10);
    if (
      a === 0 || a === 127 || a === 10 ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 169 && b === 254) ||
      a >= 224
    ) {
      return { ok: false, reason: 'Private or loopback IPs are not allowed.' };
    }
  }

  // IPv6 loopback / unique-local / link-local.
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
    return { ok: false, reason: 'Private IPv6 addresses are not allowed.' };
  }

  return { ok: true, url };
}
