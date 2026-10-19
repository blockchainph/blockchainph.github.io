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

## Certificate verification (`/verify/`)

Each BPAP certificate carries a QR code to `https://blockchainph.org/verify/?id=<CODE>`. The page looks up `verify/data/<CODE>.json`, shows the holder, program, certificate number, cohort and date, and can compare a dropped PDF against the issued SHA-256 (all in the browser).

Privacy: one JSON file per record, no index or list. The combined records file holds every name, so keep it **outside this repository** (`.gitignore` blocks `verify-records*.json` as a safety net). Do not add an index file to `verify/data/`.

### Add a new batch

1. Append the new records to your records file (an array of `{ id, certificate_no, name, program, cohort, date_given, sha256, status }`). `id` is 8 characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ`, `sha256` is the hash of the issued PDF, `status` is `valid` or `revoked`.
2. Run the script from the repo root:

   ```bash
   python3 scripts/build_verify_data.py /path/to/verify-records.json
   ```

   It validates every record, writes only new or changed files, and lists any stale files. Add `--prune` to delete files for ids you removed from the records file.
3. Commit the new `verify/data/*.json` files and push. There is no build step on GitHub Pages.

To revoke a certificate, change its `status` to `revoked`, re-run the script, commit and push.

## Local preview

Run this inside the project root:

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/blockchainph-site/
```
