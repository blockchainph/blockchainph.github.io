(function () {
  const config = window.SITE_ANALYTICS_CONFIG || {};
  const siteName = config.siteName || window.location.hostname || "site";
  const gaMeasurementId = (config.gaMeasurementId || "").trim();
  const clarityProjectId = (config.clarityProjectId || "").trim();
  const analyticsState = {
    gaLoaded: false,
    clarityLoaded: false
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

  window.gtag = window.gtag || gtag;
  window.SiteAnalytics = {
    config,
    track,
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

  Promise.allSettled([initGa(), initClarity()]).catch(() => {});
})();
