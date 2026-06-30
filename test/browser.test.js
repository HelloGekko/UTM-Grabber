const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ENGINE = fs.readFileSync(__dirname + "/../src/utm-builder.js", 'utf8');

const page1 = `<!doctype html><html><head><title>LP</title>
<script>${ENGINE}</script></head><body>
<h1>Landing</h1>
<a id="internal" href="/page2.html">Internal link</a>
<a id="external" href="https://example.com/x">External</a>
<a id="anchor" href="#section">Anchor</a>
<a id="mail" href="mailto:a@b.nl">Mail</a>
</body></html>`;

const page2 = `<!doctype html><html><head><title>P2</title>
<script>${ENGINE}</script></head><body><h1>Page 2</h1>
<a id="back" href="/">home</a></body></html>`;

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  res.setHeader('Content-Type', 'text/html');
  if (url === '/page2.html') return res.end(page2);
  res.end(page1);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {});
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  let pass = 0, fail = 0;
  const check = (name, cond) => { (cond ? pass++ : fail++); console.log((cond ? 'PASS ' : 'FAIL ') + name); };

  // 1. Land with UTM params
  await page.goto(`${base}/?utm_source=google&utm_medium=cpc&utm_campaign=zomer&gclid=ABC123`);
  await page.waitForTimeout(200);

  const cookie = await page.evaluate(() => window.UTMBuilder.get());
  check('cookie stores last-touch utm_source', cookie && cookie.last.utm_source === 'google');
  check('cookie stores click id gclid', cookie && cookie.last.gclid === 'ABC123');
  check('cookie stores first-touch', cookie && cookie.first.utm_campaign === 'zomer');

  const dl = await page.evaluate(() => (window.dataLayer || []).find(e => e.event === 'utm_builder_ready'));
  check('dataLayer push has utm_campaign', dl && dl.utm_campaign === 'zomer');
  check('dataLayer push has gclid', dl && dl.gclid === 'ABC123');
  check('dataLayer push has first-touch _1st', dl && dl.utm_source_1st === 'google');

  const intHref = await page.getAttribute('#internal', 'href');
  check('internal link decorated with utm', /utm_source=google/.test(intHref) && /utm_campaign=zomer/.test(intHref));
  check('internal link NOT decorated with gclid (default off)', !/gclid/.test(intHref));

  const extHref = await page.getAttribute('#external', 'href');
  check('external link untouched', !/utm_source/.test(extHref));
  const mailHref = await page.getAttribute('#mail', 'href');
  check('mailto link untouched', mailHref === 'mailto:a@b.nl');

  const url1 = page.url();
  check('address bar keeps utm params', /utm_source=google/.test(url1));

  // 2. Navigate by clicking the decorated internal link -> params carried server-side
  await page.click('#internal');
  await page.waitForTimeout(200);
  const url2 = page.url();
  check('page2 URL carries utm (link decoration worked)', /utm_source=google/.test(url2) && /utm_campaign=zomer/.test(url2));

  // 3. Visit page2 directly WITHOUT params -> cookie fallback restores into URL + links
  await page.goto(`${base}/page2.html`);
  await page.waitForTimeout(200);
  const url3 = page.url();
  check('page2 direct: cookie restores params into address bar', /utm_source=google/.test(url3));
  const backHref = await page.getAttribute('#back', 'href');
  check('page2 direct: links decorated from cookie', /utm_source=google/.test(backHref));

  // 4. New campaign overrides last-touch but keeps first-touch
  await page.goto(`${base}/?utm_source=newsletter&utm_campaign=herfst`);
  await page.waitForTimeout(200);
  const cookie2 = await page.evaluate(() => window.UTMBuilder.get());
  check('last-touch updates to new campaign', cookie2.last.utm_source === 'newsletter');
  check('first-touch preserved across campaigns', cookie2.first.utm_source === 'google');

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
