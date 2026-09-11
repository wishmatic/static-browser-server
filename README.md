# Static Browser Server (SBS)

## Introduction

### What is this fork?

The upstream of this fork is:
[LibreChat-AI/static-browser-server](https://github.com/LibreChat-AI/static-browser-server). It is perfectly servicable
if you wish to deploy it yourself as the security model is good as of writing and it does not need to change often/at
all.

However, if you wish to deploy a Docker container, this repo publishes an image. It also does things slightly
differently to my preference, including tests and PNPM, but it is functionally identical.

### Okay, what does this fork and the upstream do?

This repo and its upstream enables secure, isolated browser environments for running static web content. It works by:

1. Creating a unique ID for each preview session
2. Prepending this ID to the domain as a subdomain (e.g., `[random-id]-preview.static.domain.com`)
3. Using this unique origin to ensure complete isolation between previews through the browser's Same-Origin Policy
4. Leveraging Service Workers to intercept network requests and serve virtual files provided by the parent application

For a security standpoint, it's worth noting that this doesn't host any websites.

This repository publishes a public Docker image that can be used to run the server and safely use `:latest` as a tag
to be updated automatically with each release, some automated through Renovate.

## Self-Hosting

### Requirements

- A domain name you control.
- A wildcard DNS record on that domain name.
  - You must match the pattern: `RANDOMID-[your-configured-domain]`
    - E.g., in LibreChat, if you configured `SANDPACK_STATIC_BUNDLER_URL=https://preview.yourdomain.com`, you need DNS
      to support both `preview.yourdomain.com` and any subdomain of your domain (e.g., `*.yourdomain.com`).
- A wildcard SSL/TLS certificate.
  - This README.md does not explain how to do this, but our recommendation is Caddy or Nginx Proxy Manager with a
    wildcard SSL/TLS certificate through LetsEncrypt.
- A reverse proxy like Nginx, Nginx Proxy Manager, Caddy, Traefik, and so on.

HTTPS from LibreChat to the static browser server is mandatory; browser Service Workers require a secure context.

### Deployment

Deploy via Docker:

```sh
docker run -d ghcr.io/wishmatic/sbs
```

In LibreChat, set `SANDPACK_STATIC_BUNDLER_URL=https://preview.yourdomain.com`.

### Security in Production

If you're running in production:

- Implement rate limiting at the CDN or reverse proxy level to prevent abuse.
- Use modern TLS versions and secure ciphers.
- Set up auto-renewal for your wildcard certificates.
- Implement proper observability and monitoring for server health and security issues.
- Restrict access to only necessary ports and implement a Content Security Policy.

## License

The upstream fork specified Apache 2.0. This repo uses the same license.

This project is not affiliated with or endorsed by LibreChat nor CodeSandbox. Those names are trademarks of their
respective owners and are used here only to describe compatibility.
