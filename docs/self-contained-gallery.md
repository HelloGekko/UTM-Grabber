# Advies: kan de Gallery-template zónder extern script?

Korte versie: **nee, niet met behoud van de URL-persistence.** Hieronder waarom,
en wat de alternatieven zijn.

## De beperking

Een GTM Custom Template draait in een **sandbox** die de DOM niet mag aanraken.
Geverifieerd tegen de officiële API: er is geen toegang tot `document`,
`querySelectorAll`, `<a>`-elementen of `history.replaceState`. De enige manieren
waarop een template de pagina kan beïnvloeden zijn:

- `injectScript(url)` — een extern script async inladen.
- `injectHiddenIframe(url)` — een verborgen iframe inladen.

Beide vereisen een **externe URL**. Link-decoration en address-bar-rewriting —
precies wat de UTM's in de URL houdt — kunnen dus per definitie niet ín de
sandbox gebeuren.

## De opties op een rij

| Optie | URL-persistence | Extern script | In Gallery |
|-------|:---:|:---:|:---:|
| **A. Loader → jsDelivr** (huidig) | ✅ | ✅ (jsDelivr) | ✅ |
| **B. Loader → eigen domein** | ✅ | ✅ (hellogekko.nl) | ✅ |
| **C. "Lite" sandbox-template** | ❌ | ❌ | ✅ |
| **D. Custom HTML-tag** (geen template) | ✅ | ❌ | ❌ |

- **A (huidig):** volledige functionaliteit, in de Gallery, geen eigen hosting.
  Nadeel: gebruikers zien een script van `cdn.jsdelivr.net`.
- **B:** identiek aan A, maar je host `utm-builder.min.js` zelf op
  `hellogekko.nl`. Meer controle en vertrouwen (jouw merk i.p.v. een CDN),
  maar je moet caching/uptime zelf regelen. **De `injectScript`-permissie in
  `template.tpl` wijs je dan naar je eigen domein.**
- **C:** een template die alléén capture → cookie → dataLayer doet, volledig
  self-contained. Maar dan moet het formulier de waarde uit een **GTM-variabele**
  of de cookie lezen i.p.v. de URL — dat is precies het model dat we bewust niet
  wilden, en het verliest de "form leest URL-parameter"-eenvoud.
- **D:** de zelfstandige Custom HTML-tag (`gtm/custom-html-tag.html`). Volledige
  functionaliteit, nul afhankelijkheden, maar niet vindbaar in de Gallery.

## Aanbeveling

- **Voor de Gallery-listing:** blijf bij **A**. Het is de enige manier om
  volledige functionaliteit én één-klik-installatie te combineren, en jsDelivr is
  breed vertrouwd en versie-gepind.
- **Wil je het externe script onder eigen beheer?** Stap dan naar **B**: host
  `dist/utm-builder.min.js` op `hellogekko.nl` en pas de `injectScript`-URL +
  permissie aan. Functioneel verandert er niets voor de gebruiker.
- **Voor wie écht geen extern script wil:** verwijs naar **D**, de Custom
  HTML-tag in deze repo.

Kortom: we leveren A in de Gallery en D in de repo, en B is een kleine
configuratiewissel zodra je eigen hosting wilt. Een volledig self-contained
Gallery-template mét URL-persistence is technisch onmogelijk.
