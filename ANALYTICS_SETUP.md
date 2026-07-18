# Analytics Setup

This site now includes a shared analytics loader and event tracking for:

- page views
- link clicks
- button clicks
- article / update clicks
- form submit attempts
- contribution / academy submission success or error
- public comment submission success or error

## 1. Add your IDs

Edit:

- [analytics-config.js](/Users/fjnervida/Documents/New%20project/blockchainph-site/analytics-config.js)

Fill in:

```js
window.SITE_ANALYTICS_CONFIG = {
  siteName: "blockchainph.org",
  gaMeasurementId: "G-XXXXXXXXXX",
  clarityProjectId: "xxxxxxxxxx"
};
```

## 2. Google Analytics 4

Create a GA4 web data stream for `blockchainph.org`, then paste the Measurement ID into `gaMeasurementId`.

## 3. Microsoft Clarity

Create a Clarity project for `blockchainph.org`, then paste the project ID into `clarityProjectId`.

## 4. Google Search Console

Search Console still needs manual verification:

1. Add `blockchainph.org` as a property in Google Search Console
2. Verify ownership through DNS or another approved method
3. Submit your sitemap if available

## Tracked Events

Important events now available once IDs are added:

- `link_click`
- `button_click`
- `form_submit_attempt`
- `modal_open`
- `form_submit_success`
- `form_submit_validation_error`
- `form_submit_error`
- `comment_submit_success`
- `comment_submit_error`

## Notes

- If `gaMeasurementId` and `clarityProjectId` are blank, the analytics code stays idle.
- This setup is safe to deploy before the IDs are added.
