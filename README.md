# HelloGekko UTM tracker

Houd marketing-attributie (UTM's + ad-click-IDs) levend gedurende een bezoek,
zodat je formulieren de waardes gewoon **uit de URL** kunnen uitlezen — ook
nadat een bezoeker is doorgeklikt naar een andere pagina.

Geen WordPress-plugin: dit draait in **Google Tag Manager** en werkt daardoor op
elke site (WordPress, Webflow, Shopify, custom). Er zijn twee manieren om het te
installeren:

- **Gallery-template** (aanbevolen) — één klik vanuit de Community Template
  Gallery. De template laadt de engine via jsDelivr.
- **Zelfstandige Custom HTML-tag** — alle code in de tag zelf, geen externe
  afhankelijkheid. Zie [`gtm/custom-html-tag.html`](gtm/custom-html-tag.html).

Homepage: <https://hellogekko.nl/product/utm-tracker> · Licentie: Apache-2.0

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

### Optie 1 — Gallery-template (aanbevolen)
1. In je workspace: **Tags → New → Tag Configuration → Discover more tag types
   in the Community Template Gallery.**
2. Zoek **HelloGekko UTM tracker** en voeg toe aan de workspace.
3. Stel de gewenste opties in (cookie-duur, click-IDs, debug).
4. **Triggering:** *Initialization - All Pages*.
5. **Consent:** *Advanced Settings → Consent Settings* — stel zelf in welke
   consent vereist is. De template bevat met opzet geen eigen consent-logica.
6. **Submit / Publish.**

### Optie 2 — Zelfstandige Custom HTML-tag
1. **Tags → New → Tag Configuration → Custom HTML.**
2. Plak de volledige inhoud van [`gtm/custom-html-tag.html`](gtm/custom-html-tag.html).
3. Trigger *Initialization - All Pages*, consent zoals hierboven, publish.

## De template publiceren in de Gallery

De Gallery vereist een **publieke** GitHub-repo met op de `main`-branch in de root:
`template.tpl`, `metadata.yaml`, `LICENSE` (Apache-2.0) en `README.md` — allemaal
aanwezig in deze repo.

1. Maak de repo publiek en merge deze branch naar `main`.
2. Zet een release-tag `v0.1.0` (de jsDelivr-URL in `template.tpl` pint hierop).
3. Importeer `template.tpl` in GTM (**Templates → New → ⋮ → Import**), test 'm en
   accepteer in de editor de Gallery Terms of Service.
4. Ga naar <https://tagmanager.google.com/gallery>, **Submit Template**, en geef
   de repo-URL op. Reviews verschijnen meestal binnen 2–3 dagen.
5. Updates: voeg een nieuwe `sha` + `changeNotes` bovenaan `metadata.yaml` toe.

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
src/utm-builder.js        Leesbare broncode / engine (de waarheid; via jsDelivr geladen)
template.tpl              GTM Gallery-template (dunne loader die de engine inlaadt)
metadata.yaml             Gallery-metadata (homepage, documentatie, versies)
LICENSE                   Apache-2.0
gtm/custom-html-tag.html  Zelfstandige variant om in een Custom HTML-tag te plakken
docs/                     Setup- en testdocumentatie
```

## Status

v0.1 — werkende capture → store → URL-persistence → dataLayer. Zie de issues /
het bouwplan voor de volgende stappen.
