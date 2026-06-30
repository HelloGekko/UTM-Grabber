# Formulier-recepten

Omdat HelloGekko UTM tracker de UTM's **in de URL** houdt, werkt elke standaard
"populate from URL parameter"-functie. Hieronder per tool de concrete stappen.

Maak telkens verborgen velden voor de parameters die je wilt vastleggen. Een
praktische set:

```
utm_source  utm_medium  utm_campaign  utm_term  utm_content
gclid  fbclid  msclkid
```

> Tip: voeg ook eens een veld `utm_source_1st` / `utm_campaign_1st` toe als je de
> first-touch bron wilt meesturen. Die staat niet in de URL, maar wel in de
> dataLayer en cookie — gebruik daarvoor de "Algemeen / client-side"-methode
> onderaan.

---

## Gravity Forms

1. Voeg per parameter een **Hidden** veld toe.
2. Open het veld → tab **Advanced** → vink **Allow field to be populated
   dynamically** aan.
3. Zet **Parameter Name** op de exacte parameter, bijv. `utm_source`.
4. Herhaal voor elk veld (`utm_medium`, `utm_campaign`, ...).

Gravity leest de query string server-side bij het renderen — daarom is het
cruciaal dat de URL de parameters draagt (dat regelt de link-decoration).

## Elementor Forms (Pro)

1. Voeg een veld toe en zet het type op **Hidden**.
2. Zet **Field ID** / label op `utm_source`.
3. Bij **Default Value** kies **Get from URL** (Dynamic Tags → URL) en vul de
   parameternaam `utm_source` in. Bij oudere versies: zet default value op
   `[field id="utm_source"]`-stijl shortcode of gebruik de "Get from URL"-optie.
4. Herhaal per veld.

## Fluent Forms

1. Sleep een **Hidden Field** in het formulier.
2. Zet **Name Attribute** op `utm_source`.
3. Zet **Default Value** op de dynamische waarde — Fluent ondersteunt
   `{get.utm_source}` als smart code.
4. Herhaal per veld (`{get.utm_medium}`, `{get.utm_campaign}`, ...).

## WPForms

1. Voeg een **Hidden Field** toe (beschikbaar in WPForms Pro, of via het gratis
   addon-veld).
2. Zet **Default Value** met de smart tag **Query String Variable** → key
   `utm_source`.
3. Herhaal per veld.

## Contact Form 7

CF7 heeft geen ingebouwde URL-population. Twee opties:

- Gebruik een hidden-field plugin zoals **Contact Form 7 Dynamic Text Extension**
  en plaats: `[dynamichidden utm_source "CF7_GET key='utm_source'"]`. Herhaal per
  parameter.
- Of lees `$_GET['utm_source']` server-side in je eigen shortcode.

## Algemeen / client-side (elke vorm)

Werkt het server-side niet, of wil je first-touch / click-IDs uit de cookie?
Lees ze client-side uit en zet ze in het veld vlak voor verzending:

```html
<script>
  (function () {
    var data = window.UTMBuilder && window.UTMBuilder.get();
    if (!data) return;
    var last = data.last || {}, first = data.first || {};
    function fill(name, value) {
      var el = document.querySelector('[name="' + name + '"]');
      if (el && !el.value) el.value = value || '';
    }
    fill('utm_source', last.utm_source);
    fill('utm_campaign', last.utm_campaign);
    fill('gclid', last.gclid);
    fill('utm_source_1st', first.utm_source);
  })();
</script>
```

(Of doe dit als aparte Custom HTML-tag in GTM met een form-submit trigger.)
