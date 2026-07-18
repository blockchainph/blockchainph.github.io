(function () {
  const config = window.SITE_ANALYTICS_CONFIG || {};
  const siteName = config.siteName || window.location.hostname || "site";
  const gaMeasurementId = (config.gaMeasurementId || "").trim();
  const clarityProjectId = (config.clarityProjectId || "").trim();
  const consentKey = `${siteName}:analytics-consent`;
  const analyticsState = {
    gaLoaded: false,
    clarityLoaded: false,
    consent: null
  };

  window.dataLayer = window.dataLayer || [];

  function gtag() {
    window.dataLayer.push(arguments);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function initGa() {
    if (!gaMeasurementId) {
      return;
    }

    await loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`);
    gtag("js", new Date());
    gtag("config", gaMeasurementId, {
      send_page_view: true,
      anonymize_ip: true
    });
    analyticsState.gaLoaded = true;
  }

  async function initClarity() {
    if (!clarityProjectId) {
      return;
    }

    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", clarityProjectId);

    analyticsState.clarityLoaded = true;
  }

  function sanitizeLabel(value) {
    return (value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  function getElementLabel(element) {
    const explicit = element.dataset.analyticsLabel || element.getAttribute("aria-label") || element.title;
    if (explicit) {
      return sanitizeLabel(explicit);
    }

    if (element.tagName === "INPUT" && element.value) {
      return sanitizeLabel(element.value);
    }

    return sanitizeLabel(element.textContent || element.innerText || element.href || element.id || "interaction");
  }

  function buildLinkPayload(element) {
    const href = element.getAttribute("href") || "";
    const url = href ? new URL(href, window.location.origin) : null;
    const isExternal = !!url && url.origin !== window.location.origin;

    return {
      site_name: siteName,
      page_path: window.location.pathname,
      page_title: document.title,
      link_text: getElementLabel(element),
      link_url: href,
      link_type: element.dataset.analyticsType || (href.startsWith("mailto:") ? "email" : href.startsWith("tel:") ? "phone" : isExternal ? "external" : "internal")
    };
  }

  function buildButtonPayload(element) {
    return {
      site_name: siteName,
      page_path: window.location.pathname,
      page_title: document.title,
      button_text: getElementLabel(element),
      button_id: element.id || "",
      button_type: element.dataset.analyticsType || "button"
    };
  }

  function track(eventName, params) {
    const safeName = sanitizeLabel(eventName).toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    const payload = params || {};

    if (analyticsState.gaLoaded && gaMeasurementId && typeof window.gtag === "function") {
      window.gtag("event", safeName, payload);
    } else {
      gtag("event", safeName, payload);
    }

    if (analyticsState.clarityLoaded && typeof window.clarity === "function") {
      window.clarity("event", safeName);
    }
  }

  function getStoredConsent() {
    try {
      const stored = window.localStorage.getItem(consentKey);
      return stored === "granted" || stored === "denied" ? stored : null;
    } catch (error) {
      return null;
    }
  }

  function setStoredConsent(value) {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch (error) {
      return;
    }
  }

  function removeConsentUi() {
    document.querySelector("[data-analytics-banner]")?.remove();
    document.querySelector("[data-analytics-settings]")?.remove();
  }

  function renderConsentUi() {
    if (document.querySelector("[data-analytics-banner]")) {
      return;
    }

    const style = document.createElement("style");
    style.textContent = `
      .analytics-consent-banner {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 9999;
        width: min(420px, calc(100vw - 32px));
        padding: 18px 18px 16px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: rgba(11, 15, 25, 0.96);
        color: #e5edf8;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.34);
        backdrop-filter: blur(16px);
      }
      .analytics-consent-banner h2 {
        margin: 0 0 8px;
        font-size: 1rem;
        line-height: 1.3;
      }
      .analytics-consent-banner p {
        margin: 0;
        color: #c6d2e3;
        font-size: 0.92rem;
        line-height: 1.6;
      }
      .analytics-consent-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }
      .analytics-consent-actions button {
        min-height: 42px;
        padding: 0 14px;
        border: 1px solid rgba(148, 163, 184, 0.32);
        background: transparent;
        color: #e5edf8;
        font: inherit;
        cursor: pointer;
      }
      .analytics-consent-actions .accept {
        border-color: #c94a1b;
        background: #c94a1b;
        color: #ffffff;
      }
      .analytics-consent-settings {
        position: fixed;
        left: 20px;
        bottom: 20px;
        z-index: 9998;
        min-height: 38px;
        padding: 0 12px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: rgba(11, 15, 25, 0.88);
        color: #d7e3f4;
        font: inherit;
        cursor: pointer;
        backdrop-filter: blur(12px);
      }
      @media (max-width: 640px) {
        .analytics-consent-banner {
          right: 16px;
          bottom: 16px;
          left: 16px;
          width: auto;
        }
        .analytics-consent-settings {
          left: 16px;
          bottom: 16px;
        }
      }
    `;
    document.head.appendChild(style);

    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "analytics-consent-settings";
    settingsButton.dataset.analyticsSettings = "true";
    settingsButton.textContent = "Cookie settings";
    settingsButton.hidden = true;
    settingsButton.addEventListener("click", () => {
      settingsButton.hidden = true;
      renderConsentUi();
    });
    document.body.appendChild(settingsButton);

    const banner = document.createElement("aside");
    banner.className = "analytics-consent-banner";
    banner.dataset.analyticsBanner = "true";
    banner.innerHTML = `
      <h2>Analytics preferences</h2>
      <p>We use Google Analytics and Microsoft Clarity to understand visits, clicks, and content engagement. You can accept analytics or continue without them.</p>
      <div class="analytics-consent-actions">
        <button class="accept" type="button" data-analytics-accept>Accept analytics</button>
        <button type="button" data-analytics-decline>Decline</button>
      </div>
    `;
    document.body.appendChild(banner);

    banner.querySelector("[data-analytics-accept]")?.addEventListener("click", () => {
      setConsent("granted");
    });
    banner.querySelector("[data-analytics-decline]")?.addEventListener("click", () => {
      setConsent("denied");
    });
  }

  function showSettingsButton() {
    const settingsButton = document.querySelector("[data-analytics-settings]");
    if (settingsButton) {
      settingsButton.hidden = false;
    }
  }

  async function enableAnalytics() {
    await Promise.allSettled([initGa(), initClarity()]);
  }

  function setConsent(value) {
    analyticsState.consent = value;
    setStoredConsent(value);
    removeConsentUi();
    renderConsentUi();
    showSettingsButton();

    if (value === "granted") {
      enableAnalytics().then(() => {
        track("analytics_consent_granted", {
          site_name: siteName,
          page_path: window.location.pathname,
          page_title: document.title
        });
      });
      return;
    }

    track("analytics_consent_declined", {
      site_name: siteName,
      page_path: window.location.pathname,
      page_title: document.title
    });
  }

  window.gtag = window.gtag || gtag;
  window.SiteAnalytics = {
    config,
    track,
    setConsent,
    ready() {
      return analyticsState.gaLoaded || analyticsState.clarityLoaded;
    }
  };

  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (link) {
      track("link_click", buildLinkPayload(link));
      return;
    }

    const button = event.target.closest("button, input[type='submit'], input[type='button']");
    if (button) {
      track("button_click", buildButtonPayload(button));
    }
  });

  document.addEventListener("submit", event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    track("form_submit_attempt", {
      site_name: siteName,
      page_path: window.location.pathname,
      page_title: document.title,
      form_id: form.id || "",
      form_name: form.getAttribute("name") || "",
      form_action: form.getAttribute("action") || ""
    });
  });

  analyticsState.consent = getStoredConsent();
  renderConsentUi();

  if (analyticsState.consent === "granted") {
    removeConsentUi();
    renderConsentUi();
    showSettingsButton();
    enableAnalytics().catch(() => {});
  } else if (analyticsState.consent === "denied") {
    removeConsentUi();
    renderConsentUi();
    showSettingsButton();
  }
})();
