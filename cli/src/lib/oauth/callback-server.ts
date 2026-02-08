import http from 'http';
import { URL } from 'url';
import { OAuthError } from './types.js';

/**
 * Result from OAuth callback
 */
export interface CallbackResult {
  code: string;
  state: string;
}

/**
 * Success HTML page shown after authorization
 */
const SUCCESS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authentication Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #667eea;
      margin: 0 0 1rem 0;
      font-size: 1.75rem;
    }
    p {
      color: #666;
      margin: 0;
      line-height: 1.6;
    }
    .checkmark {
      font-size: 4rem;
      color: #10b981;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark">✓</div>
    <h1>Authentication Successful!</h1>
    <p>You can close this window and return to your terminal.</p>
  </div>
</body>
</html>
`;

/**
 * Error HTML page shown when authorization fails
 */
const ERROR_HTML = (error: string, description?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authentication Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #f5576c;
      margin: 0 0 1rem 0;
      font-size: 1.75rem;
    }
    p {
      color: #666;
      margin: 0;
      line-height: 1.6;
    }
    .error-icon {
      font-size: 4rem;
      color: #f5576c;
      margin-bottom: 1rem;
    }
    .error-details {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #c33;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">✗</div>
    <h1>Authentication Failed</h1>
    <p>Please return to your terminal to try again.</p>
    ${description ? `<div class="error-details"><strong>${error}</strong><br>${description}</div>` : ''}
  </div>
</body>
</html>
`;

/**
 * Start a localhost HTTP server to handle OAuth callback
 *
 * @param port - Port to listen on (default: 3000)
 * @param timeout - Timeout in milliseconds (default: 120000 = 2 minutes)
 * @returns Promise that resolves with authorization code and state
 */
export async function startCallbackServer(
  port: number = 3000,
  timeout: number = 120000
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let resolved = false;

    const server = http.createServer((req, res) => {
      if (resolved) return;

      // Only handle GET requests to root path
      if (req.method !== 'GET' || !req.url) {
        res.writeHead(404);
        res.end();
        return;
      }

      try {
        const url = new URL(req.url, `http://localhost:${port}`);

        // Check for OAuth callback parameters
        // Anthropic uses code#state format in URL hash, so check both query params and hash
        let code = url.searchParams.get('code');
        let state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        // Handle Anthropic's code#state format in URL hash
        if (!code && url.hash && url.hash.includes('#')) {
          const hashPart = url.hash.substring(1); // Remove leading #
          const hashParts = hashPart.split('#');
          if (hashParts.length === 2) {
            code = hashParts[0];
            state = hashParts[1];
          }
        }

        if (error) {
          // OAuth error from provider
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML(error, errorDescription || undefined));

          resolved = true;
          clearTimeout(timeoutId);
          server.close();
          reject(
            new OAuthError(
              `OAuth authorization failed: ${errorDescription || error}`,
              error
            )
          );
          return;
        }

        if (!code || !state) {
          // Missing required parameters
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(ERROR_HTML('invalid_request', 'Missing code or state parameter'));

          resolved = true;
          clearTimeout(timeoutId);
          server.close();
          reject(new OAuthError('Invalid callback: missing code or state'));
          return;
        }

        // Success! Return success page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(SUCCESS_HTML);

        resolved = true;
        clearTimeout(timeoutId);
        server.close();
        resolve({ code, state });
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(ERROR_HTML('server_error', 'Internal server error'));

        resolved = true;
        clearTimeout(timeoutId);
        server.close();
        reject(new OAuthError(`Callback server error: ${err}`));
      }
    });

    // Handle server errors
    server.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        reject(new OAuthError(`Failed to start callback server: ${err}`));
      }
    });

    // Start listening
    server.listen(port, 'localhost', () => {
      // Set timeout
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          server.close();
          reject(
            new OAuthError(
              `OAuth callback timeout after ${timeout / 1000} seconds. User did not complete authorization.`
            )
          );
        }
      }, timeout);
    });
  });
}

/**
 * Get the redirect URI for the callback server
 */
export function getRedirectUri(port: number = 3000): string {
  return `http://localhost:${port}`;
}
