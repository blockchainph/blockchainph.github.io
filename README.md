# BPAP Website

Static GitHub Pages site for the Blockchain Practitioners Association of the Philippines.

## Files

- `index.html`: page structure
- `styles.css`: site styling and responsive behavior
- `script.js`: section interactions, carousel behavior, and membership modal logic
- `CNAME`: custom domain for GitHub Pages
- `.nojekyll`: disables Jekyll processing on GitHub Pages

## GitHub Pages setup

Recommended repository name:

```text
blockchainph.github.io
```

This should live under the GitHub account:

```text
blockchainph
```

## Custom domain

The site is prepared for:

```text
blockchainph.org
```

If you want `www.blockchainph.org` too, configure DNS for both and set one as the redirect/canonical domain in your DNS provider.

## Membership form setup

The membership modal currently uses email fallback mode.

To connect real form submissions:

1. Open `index.html`.
2. Find the hidden input with `id="form-endpoint"`.
3. Set its `value` to your form endpoint URL.

If `form-endpoint` is blank, submissions open the visitor's email app addressed to `hello@blockchainph.org`.

## Local preview

Run this inside the project root:

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/blockchainph-site/
```
