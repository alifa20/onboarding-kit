import crypto from 'crypto';

/**
 * Generate a cryptographically secure code verifier for PKCE flow
 * RFC 7636: 43-128 characters from [A-Z, a-z, 0-9, -, ., _, ~]
 */
export function generateCodeVerifier(): string {
  const length = 128; // Maximum length for better security
  const bytes = crypto.randomBytes(length);

  // Base64-URL encode and remove padding
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, length);
}

/**
 * Generate code challenge from verifier using S256 method
 * RFC 7636: BASE64-URL(SHA256(verifier))
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();

  // Base64-URL encode without padding
  return hash
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}
