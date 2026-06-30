/*!
 * UTM Builder
 * -----------
 * Keeps marketing attribution parameters (UTMs + ad click IDs) alive across a
 * visit so that forms can read them straight from the URL.
 *
 * What it does on every page:
 *   1. CAPTURE  - read tracked params from the current URL (location.search)
 *   2. STORE    - persist first-touch and last-touch into one first-party cookie
 *   3. PERSIST  - decorate internal links so navigation carries the params, and
 *                 rewrite the address bar so the params are visible / readable
 *   4. EXPOSE   - push the values to the dataLayer for GA4 / Ads / other tags
 *
 * Designed to run inside a Google Tag Manager "Custom HTML" tag. Consent is NOT
 * handled here on purpose: gate the tag with GTM's own Consent Settings.
 *
 * No dependencies. Safe to run on every page (All Pages / Initialization).
 */
(function (window, document) {
  'use strict';

  /* ----------------------------------------------------------------------- *
   * Configuration
   * ----------------------------------------------------------------------- */
  var CONFIG = {
    // Standard UTM parameters that get captured and propagated.
    params: [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'utm_id',
      'utm_source_platform'
    ],

    // Ad-platform click identifiers. Captured and stored, but NOT glued onto
    // internal links by default (they are single-click tokens, not meant to be
    // copied across a whole session). Flip `decorateClickIds` to include them.
    clickIds: [
      'gclid',      // Google Ads
      'gbraid',     // Google Ads (iOS app->web)
      'wbraid',     // Google Ads (web->app)
      'gad_source', // Google Ads
      'fbclid',     // Meta
      'msclkid',    // Microsoft Ads
      'ttclid',     // TikTok
      'li_fat_id',  // LinkedIn
      'twclid',     // X / Twitter
      'epik',       // Pinterest
      'sccid',      // Snapchat
      'irclickid'   // Impact / affiliate
    ],

    cookieName: 'utm_builder',
    cookieDays: 90,            // how long the fallback cookie lives
    storeFirstTouch: true,     // remember the very first attribution too

    decorateLinks: true,       // glue params onto internal <a href> links
    decorateClickIds: false,   // also glue click IDs onto links (usually no)
    rewriteAddressBar: true,   // put params back into the URL via replaceState
    watchDom: true,            // re-decorate links added after page load (SPA)

    // Extra hostnames to treat as "internal" for cross-domain decoration,
    // e.g. a separate booking domain: ['afspraak.klant.nl'].
    extraDomains: [],

    dataLayerEventName: 'utm_builder_ready',
    debug: false
  };

  // Allow a host page or the GTM template to override defaults by setting
  // window.UTMBuilderConfig before this script runs. Derived values below are
  // intentionally computed AFTER this merge.
  (function (overrides) {
    if (overrides && typeof overrides === 'object') {
      for (var key in overrides) {
        if (Object.prototype.hasOwnProperty.call(overrides, key) && overrides[key] !== undefined) {
          CONFIG[key] = overrides[key];
        }
      }
    }
  })(window.UTMBuilderConfig);

  /* ----------------------------------------------------------------------- *
   * Small helpers
   * ----------------------------------------------------------------------- */
  function log() {
    if (CONFIG.debug && window.console && window.console.log) {
      window.console.log.apply(window.console, ['[UTM Builder]'].concat([].slice.call(arguments)));
    }
  }

  var ALL_KEYS = CONFIG.params.concat(CONFIG.clickIds);

  // Keys that we are allowed to write onto links / the address bar.
  var PROPAGATE_KEYS = CONFIG.params.concat(CONFIG.decorateClickIds ? CONFIG.clickIds : []);

  function now() {
    // Date.now() guarded for very old browsers.
    return (Date && Date.now) ? Date.now() : +new Date();
  }

  function readCookie(name) {
    var match = document.cookie.match('(?:^|;\\s*)' + name + '=([^;]*)');
    if (!match) return null;
    try {
      return JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {
      return null;
    }
  }

  function writeCookie(name, value, days) {
    var expires = '';
    if (days) {
      var d = new Date();
      d.setTime(now() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + d.toUTCString();
    }
    var domain = rootDomain();
    document.cookie =
      name + '=' + encodeURIComponent(JSON.stringify(value)) +
      expires +
      '; path=/' +
      (domain ? '; domain=' + domain : '') +
      '; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');
  }

  // Best-effort registrable root domain so the cookie survives subdomains
  // (www.klant.nl -> .klant.nl). Falls back to host-only on failure.
  function rootDomain() {
    var host = location.hostname;
    if (/^[\d.]+$/.test(host) || host === 'localhost') return '';
    var parts = host.split('.');
    if (parts.length <= 2) return '.' + host;
    // Probe progressively shorter domains until a test cookie sticks.
    for (var i = parts.length - 2; i >= 0; i--) {
      var candidate = '.' + parts.slice(i).join('.');
      document.cookie = '_utmb_probe=1; path=/; domain=' + candidate;
      if (document.cookie.indexOf('_utmb_probe=1') !== -1) {
        document.cookie = '_utmb_probe=; path=/; domain=' + candidate + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        return candidate;
      }
    }
    return '';
  }

  // Parse the tracked params that are actually present in a query string.
  function trackedParamsFrom(search) {
    var found = {};
    if (!search) return found;
    var query = search.charAt(0) === '?' ? search.slice(1) : search;
    var pairs = query.split('&');
    for (var i = 0; i < pairs.length; i++) {
      if (!pairs[i]) continue;
      var eq = pairs[i].indexOf('=');
      var rawKey = eq === -1 ? pairs[i] : pairs[i].slice(0, eq);
      var rawVal = eq === -1 ? '' : pairs[i].slice(eq + 1);
      var key = decodeURIComponent(rawKey).toLowerCase();
      if (ALL_KEYS.indexOf(key) === -1) continue;
      try {
        found[key] = decodeURIComponent(rawVal.replace(/\+/g, ' '));
      } catch (e) {
        found[key] = rawVal;
      }
    }
    return found;
  }

  function isEmpty(obj) {
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) return false;
    }
    return true;
  }

  /* ----------------------------------------------------------------------- *
   * Core: capture + store
   * ----------------------------------------------------------------------- */
  function captureAndStore() {
    var fromUrl = trackedParamsFrom(location.search);
    var stored = readCookie(CONFIG.cookieName) || { first: {}, last: {}, first_ts: 0, last_ts: 0 };

    if (!isEmpty(fromUrl)) {
      // A fresh touch: only the params present in this URL form the new touch.
      stored.last = fromUrl;
      stored.last_ts = now();
      if (CONFIG.storeFirstTouch && isEmpty(stored.first)) {
        stored.first = fromUrl;
        stored.first_ts = now();
      }
      writeCookie(CONFIG.cookieName, stored, CONFIG.cookieDays);
      log('captured from URL', fromUrl);
    }

    // The "active" set we propagate is the most recent touch we know about.
    var active = !isEmpty(fromUrl) ? fromUrl : stored.last || {};
    return { active: active, stored: stored };
  }

  /* ----------------------------------------------------------------------- *
   * Persist: address bar + internal links
   * ----------------------------------------------------------------------- */
  function propagateValues(active) {
    var out = {};
    for (var key in active) {
      if (Object.prototype.hasOwnProperty.call(active, key) && PROPAGATE_KEYS.indexOf(key) !== -1) {
        out[key] = active[key];
      }
    }
    return out;
  }

  function appendParams(urlObj, values) {
    var changed = false;
    for (var key in values) {
      if (!Object.prototype.hasOwnProperty.call(values, key)) continue;
      if (!urlObj.searchParams.has(key)) {
        urlObj.searchParams.set(key, values[key]);
        changed = true;
      }
    }
    return changed;
  }

  function rewriteAddressBar(values) {
    if (isEmpty(values) || !window.history || !history.replaceState || !window.URL) return;
    try {
      var url = new URL(location.href);
      if (appendParams(url, values)) {
        history.replaceState(history.state, '', url.toString());
        log('address bar rewritten', url.search);
      }
    } catch (e) {
      log('replaceState skipped', e);
    }
  }

  function isInternal(host) {
    return host === location.host || CONFIG.extraDomains.indexOf(host) !== -1;
  }

  function decorateLink(a, values) {
    var href = a.getAttribute('href');
    if (!href) return;
    var lower = href.toLowerCase();
    if (lower.charAt(0) === '#' ||
        lower.indexOf('mailto:') === 0 ||
        lower.indexOf('tel:') === 0 ||
        lower.indexOf('javascript:') === 0) {
      return;
    }
    try {
      var url = new URL(href, location.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      if (!isInternal(url.host)) return;
      if (appendParams(url, values)) {
        a.setAttribute('href', url.toString());
      }
    } catch (e) {
      /* malformed href: leave it alone */
    }
  }

  function decorateAll(values) {
    if (isEmpty(values) || !window.URL) return;
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
      decorateLink(links[i], values);
    }
    log('decorated ' + links.length + ' links');
  }

  function watchNewLinks(values) {
    if (!window.MutationObserver) return;
    var pending = false;
    var observer = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      // Batch: re-run once on the next frame instead of per-mutation.
      (window.requestAnimationFrame || window.setTimeout)(function () {
        pending = false;
        decorateAll(values);
      }, 0);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ----------------------------------------------------------------------- *
   * Expose: dataLayer + global API
   * ----------------------------------------------------------------------- */
  function pushToDataLayer(active, stored) {
    window.dataLayer = window.dataLayer || [];
    var payload = { event: CONFIG.dataLayerEventName };
    var k;
    for (k in active) {
      if (Object.prototype.hasOwnProperty.call(active, k)) payload[k] = active[k];
    }
    if (CONFIG.storeFirstTouch && stored && stored.first) {
      for (k in stored.first) {
        if (Object.prototype.hasOwnProperty.call(stored.first, k)) payload[k + '_1st'] = stored.first[k];
      }
    }
    window.dataLayer.push(payload);
    log('dataLayer push', payload);
  }

  /* ----------------------------------------------------------------------- *
   * Run
   * ----------------------------------------------------------------------- */
  function run() {
    var result = captureAndStore();
    var active = result.active;
    var stored = result.stored;
    var values = propagateValues(active);

    if (CONFIG.rewriteAddressBar) rewriteAddressBar(values);

    if (CONFIG.decorateLinks) {
      onReady(function () {
        decorateAll(values);
        if (CONFIG.watchDom) watchNewLinks(values);
      });
    }

    pushToDataLayer(active, stored);

    // Public API for debugging or custom form scripts.
    window.UTMBuilder = {
      get: function () { return readCookie(CONFIG.cookieName); },
      active: function () { return active; },
      config: CONFIG
    };
  }

  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  run();
})(window, document);
