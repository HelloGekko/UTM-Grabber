___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (the "Gallery TOS") and
the Google API Services User Data Policy.


___INFO___

{
  "type": "TAG",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "HelloGekko UTM tracker",
  "categories": ["ANALYTICS", "MARKETING", "UTILITY"],
  "brand": {
    "id": "hellogekko",
    "displayName": "HelloGekko"
  },
  "description": "Keeps UTM parameters and ad click IDs alive across a visit. Captures them from the URL, stores first- and last-touch in a first-party cookie, decorates internal links and rewrites the address bar so forms can read the values straight from the URL, and pushes everything to the dataLayer.",
  "containerContexts": [
    "WEB"
  ]
}


___TEMPLATE_PARAMETERS___

[
  {
    "type": "LABEL",
    "name": "intro",
    "displayName": "Keeps UTM parameters in the URL across navigation so forms can read them as URL parameters. The engine is loaded from jsDelivr (cdn.jsdelivr.net). Set the tag to fire on 'Initialization - All Pages' and configure consent in the tag's Consent Settings."
  },
  {
    "type": "TEXT",
    "name": "cookieDays",
    "displayName": "Fallback cookie lifetime (days)",
    "simpleValueType": true,
    "defaultValue": 90,
    "valueValidators": [
      {
        "type": "POSITIVE_NUMBER"
      }
    ],
    "help": "How long the fallback first-party cookie lives. The cookie restores the parameters if a visitor follows a link that was not decorated."
  },
  {
    "type": "CHECKBOX",
    "name": "storeFirstTouch",
    "checkboxText": "Also remember the first-touch source",
    "simpleValueType": true,
    "defaultValue": true,
    "help": "Keeps the very first attribution as well as the most recent one. First-touch values are exposed in the dataLayer with a _1st suffix."
  },
  {
    "type": "CHECKBOX",
    "name": "rewriteAddressBar",
    "checkboxText": "Rewrite the address bar (history.replaceState)",
    "simpleValueType": true,
    "defaultValue": true,
    "help": "Puts the active parameters back into the visible URL even when the visitor arrived through a link without them. Turn off if it conflicts with a single-page-app router."
  },
  {
    "type": "CHECKBOX",
    "name": "watchDom",
    "checkboxText": "Re-decorate links added after page load",
    "simpleValueType": true,
    "defaultValue": true,
    "help": "Uses a MutationObserver to decorate links injected later (menus, pop-ups, SPA navigation)."
  },
  {
    "type": "CHECKBOX",
    "name": "decorateClickIds",
    "checkboxText": "Also glue ad click IDs (gclid, fbclid, ...) onto links",
    "simpleValueType": true,
    "defaultValue": false,
    "help": "Click IDs are single-use tokens; usually you do not want them copied across every internal link. They are always captured into the cookie and dataLayer regardless of this setting."
  },
  {
    "type": "CHECKBOX",
    "name": "debug",
    "checkboxText": "Enable console debug logging",
    "simpleValueType": true,
    "defaultValue": false
  }
]


___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const injectScript = require('injectScript');
const setInWindow = require('setInWindow');
const makeNumber = require('makeNumber');

// Versioned, immutable build served by jsDelivr from the public GitHub repo.
const SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/HelloGekko/UTM-Grabber@v0.1.0/src/utm-builder.js';

const config = {
  cookieDays: makeNumber(data.cookieDays) || 90,
  storeFirstTouch: data.storeFirstTouch !== false,
  rewriteAddressBar: data.rewriteAddressBar !== false,
  watchDom: data.watchDom !== false,
  decorateClickIds: data.decorateClickIds === true,
  debug: data.debug === true
};

// Hand the configuration to the injected engine.
setInWindow('UTMBuilderConfig', config, true);

injectScript(SCRIPT_URL, data.gtmOnSuccess, data.gtmOnFailure, 'utmBuilderScript');


___WEB_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "inject_script",
        "versionId": "1"
      },
      "param": [
        {
          "key": "urls",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 1,
                "string": "https://cdn.jsdelivr.net/gh/HelloGekko/UTM-Grabber*"
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_globals",
        "versionId": "1"
      },
      "param": [
        {
          "key": "keys",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "UTMBuilderConfig"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  }
]


___TESTS___

scenarios: []


___NOTES___

Loader template for "HelloGekko UTM tracker". The sandboxed GTM template cannot
touch the DOM, so it injects the open-source engine (src/utm-builder.js) from
jsDelivr, which performs URL capture, first-party cookie storage, link
decoration, address-bar rewriting and the dataLayer push. Consent is left to the
tag's own Consent Settings on purpose.
