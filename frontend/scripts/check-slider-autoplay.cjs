const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// Real browser timing and image files: this deliberately does not mock scrolling or timers.
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const items = ['Orchard home', 'Mountain hotel', 'Valley land'].map((title, index) => ({
      id: String(index), slug: `fixture-${index}`, title, category: 'HOTEL', purpose: 'SALE',
      description: 'A property in Manali with mountain views.', priceMode: 'PRICE_ON_REQUEST',
      currency: 'INR', priceMinor: null, areaValue: null, areaUnit: null, locality: 'Manali', city: 'Manali',
      amenities: [], verificationStatus: 'UNVERIFIED',
      media: [{ deliveryUrl: `/images/estate-${index}.jpg`, altText: title, isCover: true }],
    }));
    await page.route('**/api/v1/properties?*', route => route.fulfill({ json: { items, pagination: { page: 1, total: 3, totalPages: 1 } } }));
    await page.route('**/api/v1/site/**', route => route.fulfill({ json: {} }));
    await page.goto('http://localhost:3000/');
    const slider = page.locator('.featured-slider');
    const stage = slider.locator('.featured-stage');
    await stage.scrollIntoViewIfNeeded();
    await stage.hover();
    await page.waitForFunction(() => document.querySelector('.featured-slide[aria-hidden="false"] h3')?.textContent === 'Mountain hotel', {}, { timeout: 12000 });
    await page.waitForFunction(() => {
      const element = document.querySelector('.featured-stage');
      const image = element.querySelector('.featured-slide[aria-hidden="false"] img');
      return Math.abs(element.scrollLeft - element.clientWidth) < 2 && image.complete && image.naturalWidth > 0;
    });
    assert.equal(await slider.locator('.featured-slide[aria-hidden="false"] img').getAttribute('src'), '/images/estate-1.jpg');
    console.log('PASS loaded image slides automatically while mouse remains over the carousel');
    await slider.locator('.featured-slide[aria-hidden="false"] .featured-description').tap();
    const before = await slider.locator('.featured-slide[aria-hidden="false"] h3').innerText();
    await page.waitForFunction(title => document.querySelector('.featured-slide[aria-hidden="false"] h3')?.textContent !== title, before, { timeout: 12000 });
    console.log('PASS autoplay resumes after touch without pressing a resume control');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
