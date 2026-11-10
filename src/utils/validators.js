/** Small, dependency-free validators shared by the forms. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value = '') {
  return EMAIL_RE.test(String(value).trim());
}

/** Accepts only http(s) URLs. */
export function isValidUrl(value = '') {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
