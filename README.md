# Static Browser Server for Sandpack

> This guide has been modified to match my infrastructure and software choices.

The static browser server enables secure, isolated browser environments for running static web content. It works by:

1. Creating a unique ID for each preview session
2. Prepending this ID to the domain as a subdomain (e.g., `[random-id]-preview.static.domain.com`)
3. Using this unique origin to ensure complete isolation between previews through the browser's Same-Origin Policy
4. Leveraging Service Workers to intercept network requests and serve virtual files provided by the parent application

For a security standpoint, it's worth noting that this doesn't host any websites.

This repository publishes a private Docker image that can be used to run the server and safely use `:latest` as a tag
to be updated automatically with each release, some automated through Renovate.

## Self-Hosting

### Requirements

1.  **Domain Name:** A domain you control
2.  **Wildcard DNS:** Ability to configure wildcard DNS records that will match the pattern
    `RANDOMID-[your-configured-domain]`. For example, if you configure
    `SANDPACK_STATIC_BUNDLER_URL=https://preview.yourdomain.com` (a LibreChat-specific environment variable), you need
    DNS to support both `preview.yourdomain.com` and any subdomain of your domain (e.g., `*.yourdomain.com`)
3.  **Wildcard SSL/TLS Certificate:** A valid certificate covering both your base domain and the wildcard domain. For
    example, if you configure `SANDPACK_STATIC_BUNDLER_URL=https://preview.yourdomain.com`, your certificate needs to
    cover both `preview.yourdomain.com` and `*.yourdomain.com`. Standard wildcard certificates (not specific to the
    prefix pattern) work correctly with this system
4.  **Reverse Proxy:** A server like Nginx, Caddy, Traefik, etc., capable of handling HTTPS/TLS termination and
    proxying requests
5.  **Node.js Environment:** A server environment to run the Node.js static server application
6.  **HTTPS is Mandatory:** Service Workers require a secure context, meaning your self-hosted static server
    **must** be served over HTTPS with a valid certificate

### The URL Pattern

The most important thing to understand about this system is how the `SANDPACK_STATIC_BUNDLER_URL` configuration works
(this is a LibreChat environment variable, not a variable for this static server):

1. **Random ID Prefixing:** When you set `SANDPACK_STATIC_BUNDLER_URL` to any value, the system will **prepend a
   random ID** to the **entire hostname** part of that URL
2. **Examples:**
    - If you set: `SANDPACK_STATIC_BUNDLER_URL=https://yourdomain.com`
        - Requests go to: `https://RANDOMID-yourdomain.com`
    - If you set: `SANDPACK_STATIC_BUNDLER_URL=https://sandpack.yourdomain.com`
        - Requests go to: `https://RANDOMID-sandpack.yourdomain.com`
3. **DNS and Certificate Requirements:** Your DNS and SSL certificates must be configured to handle this pattern
4. **Choosing Your Domain:** You can use any domain structure you prefer (single domain, subdomain, multiple
   subdomains), as long as you configure your DNS and certificates to handle the random ID prefix pattern

### Deployment

- Install dependencies (`npm install`)
- Build the production assets (`npm run build`)
- Deploy the built Node.js application, probably using Docker
- Ensure you run the compiled server script (e.g., `node out/servers/preview-server.js`), **not** using devtools like
  `esbuild-register`

Specific to Librechat, set `SANDPACK_STATIC_BUNDLER_URL=https://preview.yourdomain.com`.

### Security Considerations for Production

1. **Rate limiting**: Implement rate limiting to prevent abuse
2. **Proper SSL configuration**: Use modern TLS versions and secure ciphers
3. **Regular certificate renewal**: Set up auto-renewal for your wildcard certificates
4. **Monitoring**: Implement proper monitoring for server health and security issues
5. **Firewall rules**: Restrict access to only necessary ports
6. **Content Security Policy**: Consider implementing CSP headers for additional security

## How It Works (Simplified)

1.  **Static Server Deployment**: The Node.js application you deploy (from this repository). It serves the core relay
    and service worker files
2.  **Relay**: A hidden iframe loaded by the client application (e.g., Sandpack within LibreChat) from your deployed
    server's domain. It acts as a communication bridge
3.  **Service Worker**: Registered by the Relay. It intercepts network requests _within the isolated preview
    environment_ (e.g., `[random-id]-sandpack.yourdomain.com`)

When a preview is initialized by the client application (like Sandpack in LibreChat):

1.  The client generates a unique preview URL by prepending a random ID to your configured domain (e.g., if you set
    `SANDPACK_STATIC_BUNDLER_URL=https://preview.yourdomain.com`, it becomes `https://RANDOMID-preview.yourdomain.com`)
2.  The client loads the Relay iframe from your server (e.g., `https://preview.yourdomain.com/__csb_relay/`)
3.  The Relay registers the Service Worker for the unique preview origin
4.  The Service Worker intercepts requests within the preview iframe
5.  Requests are sent back to the client application (via the Relay) to get the actual file content
6.  The client application provides the content (e.g., HTML, CSS, JS)
7.  The Service Worker serves this content within the isolated preview iframe

This architecture ensures complete isolation between different previews, as each preview runs in its own browser origin.
