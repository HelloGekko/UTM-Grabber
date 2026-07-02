/*!
 * UTM Builder - URL keeper
 * ------------------------
 * Tiny companion script for the "HelloGekko UTM tracker" GTM template.
 *
 * The GTM template sandbox is not allowed to touch history.* or the DOM, so
 * the template handles capture -> cookie -> dataLayer itself and loads this
 * script only to keep the parameters in the URL:
 *   - restore missing UTM params into the address bar (history.replaceState)
 *   - decorate internal links so navigation carries the params
 *
 * Reads the same first-party cookie the template writes ("utm_builder").
 * No capture, no cookie writes, no dataLayer pushes - so it never duplicates
 * events when combined with the template.
 */
(function (window, document) {
  'use strict';

  var PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'utm_source_platform'];
  var COOKIE_NAME = 'utm_builder';

  function readCookie(name) {
    var match = document.cookie.match('(?:^|;\\s*)' + name + '=([^;]*)');
    if (!match) return null;
    try {
      return JSON.parse(decodeURIComponent(match[1]));
    } catch (e) {
      return null;
    }
  }

  function paramsFrom(search) {
    var found = {};
    if (!search) return found;
    var query = search.charAt(0) === '?' ? search.slice(1) : search;
    var pairs = query.split('&');
    for (var i = 0; i < pairs.length; i++) {
      if (!pairs[i]) continue;
      var eq = pairs[i].indexOf('=');
      var key = decodeURIComponent(eq === -1 ? pairs[i] : pairs[i].slice(0, eq)).toLowerCase();
      if (PARAMS.indexOf(key) === -1) continue;
      try {
        found[key] = decodeURIComponent((eq === -1 ? '' : pairs[i].slice(eq + 1)).replace(/\+/g, ' '));
      } catch (e) {
        found[key] = eq === -1 ? '' : pairs[i].slice(eq + 1);
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

  // Active set: params already in the URL win; otherwise last-touch from cookie.
  var fromUrl = paramsFrom(location.search);
  var active = fromUrl;
  if (isEmpty(active)) {
    var stored = readCookie(COOKIE_NAME);
    active = {};
    if (stored && stored.last) {
      for (var k in stored.last) {
        if (Object.prototype.hasOwnProperty.call(stored.last, k) && PARAMS.indexOf(k) !== -1) {
          active[k] = stored.last[k];
        }
      }
    }
  }
  if (isEmpty(active) || !window.URL) return;

  function appendParams(urlObj) {
    var changed = false;
    for (var key in active) {
      if (Object.prototype.hasOwnProperty.call(active, key) && !urlObj.searchParams.has(key)) {
        urlObj.searchParams.set(key, active[key]);
        changed = true;
      }
    }
    return changed;
  }

  // 1. Restore into the address bar.
  if (window.history && history.replaceState) {
    try {
      var current = new URL(location.href);
      if (appendParams(current)) {
        history.replaceState(history.state, '', current.toString());
      }
    } catch (e) { /* leave the URL alone */ }
  }

  // 2. Decorate internal links.
  function decorateAll() {
    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href) continue;
      var lower = href.toLowerCase();
      if (lower.charAt(0) === '#' || lower.indexOf('mailto:') === 0 ||
          lower.indexOf('tel:') === 0 || lower.indexOf('javascript:') === 0) continue;
      try {
        var url = new URL(href, location.href);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
        if (url.host !== location.host) continue;
        if (appendParams(url)) {
          links[i].setAttribute('href', url.toString());
        }
      } catch (e) { /* malformed href */ }
    }
  }

  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  onReady(function () {
    decorateAll();
    if (window.MutationObserver) {
      var pending = false;
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        (window.requestAnimationFrame || window.setTimeout)(function () {
          pending = false;
          decorateAll();
        }, 0);
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  });
})(window, document);
