const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// Both local servers must be running. These checks read the CMS without changing its data.
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    let browserHomeRequests = 0;
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/\/api\/v1\/site\/pages\/(home|images)$/.test(request.url())) browserHomeRequests++; });
    await page.addInitScript(() => {
      window.__heroTitles = [];
      new MutationObserver(() => {
        const title = document.querySelector('.home-hero h1')?.textContent;
        if (title && window.__heroTitles[window.__heroTitles.length - 1] !== title) window.__heroTitles.push(title);
      }).observe(document, { childList: true, subtree: true, characterData: true });
    });
    const cmsResponse = await page.request.get('http://localhost:4000/api/v1/site/pages/home');
    const cms = cmsResponse.ok() ? await cmsResponse.json() : {};
    const expected = cms.page?.sections?.hero?.title || 'Own a piece of the Himalayas.';
    const response = await page.goto('http://localhost:3000/');
    const html = await response.text();
    const serverTitle = await page.evaluate(markup => new DOMParser().parseFromString(markup, 'text/html').querySelector('.home-hero h1')?.textContent, html);
    assert.equal(serverTitle, expected, 'Published headline is included in server HTML');
    await page.waitForTimeout(800);
    assert.deepEqual(await page.evaluate(() => window.__heroTitles), [expected], 'Hydration must not replace a default headline');
    assert.equal(browserHomeRequests, 0, 'Hydration reuses the server CMS snapshot');
    assert.equal(await page.locator('.hero-content').evaluate(element => getComputedStyle(element).opacity), '1');
    await page.locator('.home-hero input[name=q]').fill('Old Manali');
    await page.locator('.home-hero select[name=category]').selectOption('HOTEL');
    await page.locator('.home-hero .hero-foot').click();
    await page.evaluate(() => document.fonts.ready);
    const before = await page.locator('.home-hero .search-panel').boundingBox();
    await page.waitForFunction(title => document.querySelector('.home-hero h1')?.textContent !== title, expected, { timeout: 14000 });
    const after = await page.locator('.home-hero .search-panel').boundingBox();
    assert(Math.abs(after.y - before.y) < 2, 'Search form must not jump between slides');
    assert.equal(await page.locator('.home-hero input[name=q]').inputValue(), 'Old Manali');
    assert.equal(await page.locator('.home-hero select[name=category]').inputValue(), 'HOTEL');
    const active = page.locator('.hero-slide-photo.is-active');
    assert.equal(await active.evaluate(image => image.complete && image.naturalWidth > 0), true);
    console.log('PASS server-rendered CMS headline, no hydration text swap, loaded-image autoplay and stable search form');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(100);
    const title = await page.locator('.home-hero h1').innerText();
    await page.clock.install();
    await page.clock.runFor(8000);
    assert.equal(await page.locator('.home-hero h1').innerText(), title, 'Reduced motion disables automatic rotation');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px overflow`);
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS reduced motion and four viewport widths');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
