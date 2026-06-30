# UTM's naar GA4 sturen

De tag pusht bij elke page view een dataLayer-event `utm_builder_ready` met de
actieve UTM's, de click-IDs en de first-touch-waardes (suffix `_1st`):

```js
{
  event: 'utm_builder_ready',
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: 'zomer',
  gclid: 'ABC123',
  utm_source_1st: 'google',
  utm_campaign_1st: 'zomer'
}
```

GA4 verzamelt UTM's standaard al op sessieniveau. Dit is bedoeld om de waardes
**aan specifieke events te koppelen** (bijv. een `generate_lead`), zodat je
lead-niveau attributie in GA4 / BigQuery hebt.

## 1. Data Layer-variabelen maken

Maak in GTM **Variables → New → Data Layer Variable** voor elke waarde die je
nodig hebt:

| Variabele-naam | Data Layer Variable Name |
|----------------|--------------------------|
| `DLV - utm_source` | `utm_source` |
| `DLV - utm_medium` | `utm_medium` |
| `DLV - utm_campaign` | `utm_campaign` |
| `DLV - gclid` | `gclid` |
| `DLV - utm_source_1st` | `utm_source_1st` |

## 2. Meesturen op je GA4-event

Open je GA4 **Event**-tag (bijv. de `generate_lead` die op form-submit firet) en
voeg onder **Event Parameters** toe:

| Parameter Name | Value |
|----------------|-------|
| `lead_utm_source` | `{{DLV - utm_source}}` |
| `lead_utm_campaign` | `{{DLV - utm_campaign}}` |
| `lead_gclid` | `{{DLV - gclid}}` |

> Gebruik een eigen prefix (`lead_`) zodat je ze niet verwart met de automatische
> GA4-`source`/`campaign`-dimensies.

Wil je ze op álle events? Zet ze dan in je **GA4 Configuration / Google Tag** als
event-parameters, of als **User Property** (bijv. `first_utm_source` =
`{{DLV - utm_source_1st}}`) voor first-touch.

## 3. Custom dimensions registreren

In GA4: **Admin → Custom definitions → Create custom dimension**. Maak per
parameter een dimensie (event-scoped voor `lead_*`, user-scoped voor first-touch
user properties). Daarna verschijnen ze in rapporten en Explorations.

## 4. (Optioneel) Google Ads

Stuur `gclid` mee met je conversie of gebruik enhanced conversions. Voor de
meeste accounts doet auto-tagging dit al; de `gclid` in de dataLayer is handig
voor offline-conversie-uploads (gclid + lead samen naar je CRM).
