# UTM Builder testen

## Snelle rooktest (zonder GTM)

1. Open je site met test-parameters:
   `https://jouwsite.nl/?utm_source=test&utm_medium=cpc&utm_campaign=demo`
2. Open de console en zet eventueel `debug: true` in CONFIG.
3. Controleer:
   - `UTMBuilder.get()` toont een cookie met `first` en `last`.
   - Hover over een interne link → de href bevat `?utm_source=test&...`.
   - Klik door naar een andere pagina → de UTM's staan nog in de URL.
   - `dataLayer` bevat een `utm_builder_ready` event met de waardes.

## In GTM (Preview / Tag Assistant)

1. Klik **Preview** in je workspace en open je site met UTM-parameters.
2. Controleer dat de **UTM Builder** Custom HTML-tag is gefired op de eerste page view.
3. Wissel naar een interne pagina en bevestig dat de tag opnieuw firet en de
   params behouden blijven.
4. Vul een testformulier in en bevestig dat de UTM-velden meekomen in de
   inzending / je CRM.

## Aandachtspunten

- **Consent:** als je consent-vereisten op de tag zet, firet de tag pas ná
  toestemming. Test zowel mét als zónder consent.
- **Caching:** de tag draait client-side, dus paginacache is geen probleem.
  Wel goed checken bij klanten met agressieve HTML-minificatie of de tag intact
  blijft.
- **SPA / dynamisch geladen links:** `watchDom: true` her-decoreert links die na
  de page load verschijnen. Test menu's en pop-ups die lazy laden.
- **replaceState:** als een site een eigen SPA-router heeft, controleer dat het
  herschrijven van de adresbalk geen dubbele history-entries of routing-bugs
  veroorzaakt. Zet `rewriteAddressBar: false` als dat botst.
