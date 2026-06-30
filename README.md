# UTM Builder

Houd marketing-attributie (UTM's + ad-click-IDs) levend gedurende een bezoek,
zodat je formulieren de waardes gewoon **uit de URL** kunnen uitlezen — ook
nadat een bezoeker is doorgeklikt naar een andere pagina.

Geen WordPress-plugin: dit draait als één **Google Tag Manager Custom HTML-tag**
en werkt daardoor op elke site (WordPress, Webflow, Shopify, custom).

## Het principe

```
Bezoeker landt op  /lp?utm_source=google&utm_campaign=zomer
        │
        ▼
  1. CAPTURE   lees utm_* + click-IDs uit de URL
  2. STORE     bewaar first-touch én last-touch in 1 first-party cookie (vangnet)
  3. PERSIST   ├─ plak de UTM's aan alle interne links  (link decoration)
        │      └─ zet ze terug in de adresbalk          (history.replaceState)
  4. EXPOSE    push de waardes naar de dataLayer (GA4 / Ads / overig)
        │
        ▼
Bezoeker klikt door naar  /contact?utm_source=google&utm_campaign=zomer
        │
        ▼
  Formulier leest utm_source / utm_campaign uit de URL en stuurt ze mee.
```

Waarom link decoration en niet "hidden field injectie"? Form-tools zoals Gravity
Forms en Elementor lezen de query string **server-side, bij het renderen** van de
pagina. De parameters moeten dus écht in het paginaverzoek zitten. Door ze aan de
interne links te plakken draagt elke navigatie ze mee. De cookie is enkel een
vangnet voor het geval iemand een niet-gedecoreerde link volgt.

## Installeren in Google Tag Manager

1. **Tags → New → Tag Configuration → Custom HTML.**
2. Plak de volledige inhoud van [`gtm/custom-html-tag.html`](gtm/custom-html-tag.html).
3. **Triggering:** kies *Initialization - All Pages* (draait het vroegst).
   Niet beschikbaar? Gebruik dan *All Pages*.
4. **Consent:** open *Advanced Settings → Consent Settings* en stel daar zelf in
   welke consent vereist is (bijv. `ad_storage` / `analytics_storage`). De tag
   bevat met opzet geen eigen consent-logica.
5. **Submit / Publish.**

## Lezen in je formulier

### Gravity Forms
1. Maak een verborgen veld (Hidden field).
2. **Advanced → Allow field to be populated dynamically → Parameter Name** =
   `utm_source` (idem voor `utm_medium`, `utm_campaign`, ...).

### Elementor Forms
Zet bij het verborgen veld de **Field ID** op `utm_source` en kies bij het veld
*Default Value → Get from URL* met parameter `utm_source`.

### Contact Form 7
Met de plugin *CF7 Smart Grad* of een hidden-field add-on; of lees `$_GET` in een
shortcode. (Server-side dynamische velden werken omdat de URL de params draagt.)

### Algemeen (elke vorm)
Omdat de UTM's in de URL staan, werkt elke standaard "populate from URL
parameter"-functie. Voor maatwerk is er ook een client-side API:

```js
UTMBuilder.get();      // { first:{...}, last:{...}, first_ts, last_ts }
UTMBuilder.active();   // de waardes die nu gepropageerd worden
```

## Configuratie

Pas het `CONFIG`-blok bovenin de tag aan:

| Optie | Default | Betekenis |
|-------|---------|-----------|
| `params` | utm_source/medium/campaign/term/content/id/source_platform | UTM-parameters die je vangt en doorgeeft |
| `clickIds` | gclid, fbclid, msclkid, ... | Ad-click-IDs die je vangt en opslaat |
| `cookieDays` | 90 | Levensduur van de vangnet-cookie |
| `storeFirstTouch` | true | Bewaar ook de allereerste bron |
| `decorateLinks` | true | Plak params op interne links |
| `decorateClickIds` | false | Ook click-IDs op links plakken (meestal niet) |
| `rewriteAddressBar` | true | Params terug in de adresbalk (replaceState) |
| `watchDom` | true | Her-decoreer links die later geladen worden (SPA) |
| `extraDomains` | `[]` | Extra hosts die als "intern" gelden (cross-domain) |
| `debug` | false | Console-logging aanzetten |

## Repo-structuur

```
src/utm-builder.js        Leesbare broncode (de waarheid)
gtm/custom-html-tag.html  Kant-en-klaar te plakken in een GTM Custom HTML-tag
docs/                     Setup- en testdocumentatie
```

## Status

v0.1 — werkende capture → store → URL-persistence → dataLayer. Zie de issues /
het bouwplan voor de volgende stappen.
