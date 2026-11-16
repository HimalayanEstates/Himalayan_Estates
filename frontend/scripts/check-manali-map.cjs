const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:3000/properties/the-orchard-room');
    const section = page.locator('.manali-location');
    await section.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelectorAll('.leaflet-marker-icon').length === 3);
    await page.waitForFunction(() => document.querySelectorAll('.leaflet-tile-loaded').length > 0, {}, { timeout: 25000 });
    for (const name of ['Mall Road', 'Hidimba Devi Temple', 'Atal Tunnel · South Portal']) {
      const button = section.locator('.manali-landmark-button').filter({ hasText: name });
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await section.locator('.leaflet-popup-content').innerText(), name);
    }
    await section.getByRole('button', { name: 'Show all places' }).click();
    assert.equal(await section.locator('.manali-landmark-button[aria-pressed=true]').count(), 0);
    for (const link of await section.getByRole('link', { name: 'Open in Maps', exact: false }).all()) {
      const url = new URL(await link.getAttribute('href'));
      assert.equal(url.hostname, 'www.google.com');
      assert(url.searchParams.get('query').includes(','));
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS map tiles, three pins, landmark selection, reset, external links and four viewport widths');
    await page.route('https://tile.openstreetmap.org/**', route => route.abort());
    await page.reload();
    await section.scrollIntoViewIfNeeded();
    await section.locator('.manali-map-error').waitFor();
    assert.equal(await section.getByRole('link', { name: 'Open in Maps', exact: false }).count(), 3);
    console.log('PASS unavailable-tile message and fallback links');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
