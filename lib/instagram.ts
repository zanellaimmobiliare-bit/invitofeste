const USERNAME_CHARSET_RE = /^[A-Za-z0-9._]{1,30}$/;
const INSTAGRAM_URL_RE = /^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/([^/?#]+)\/?/i;

// Paths Instagram reserves for itself — never real profile usernames.
const RESERVED_PATHS = new Set([
  'p',
  'reel',
  'reels',
  'stories',
  'explore',
  'accounts',
  'direct',
  'tv',
  'about',
  'developer',
  'legal',
  'privacy',
  'terms',
]);

function isValidUsername(candidate: string): boolean {
  if (!USERNAME_CHARSET_RE.test(candidate)) return false;
  if (candidate.startsWith('.') || candidate.endsWith('.')) return false;
  if (candidate.includes('..')) return false;
  if (RESERVED_PATHS.has(candidate.toLowerCase())) return false;
  return true;
}

/**
 * Accepts a bare username, an @username, or an instagram.com/instagr.am URL.
 * Returns the normalized lowercase username, or null if the input isn't a
 * syntactically valid Instagram profile reference.
 */
export function normalizeInstagramInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(INSTAGRAM_URL_RE);
  if (urlMatch) {
    const candidate = decodeURIComponent(urlMatch[1]);
    return isValidUsername(candidate) ? candidate.toLowerCase() : null;
  }

  const bare = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  return isValidUsername(bare) ? bare.toLowerCase() : null;
}

export function instagramProfileUrl(username: string): string {
  return `https://instagram.com/${username}`;
}
