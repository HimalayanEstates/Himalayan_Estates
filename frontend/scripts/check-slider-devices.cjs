const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// Requires the frontend on port 3000. API fixtures keep these checks independent of production data.
(async () => {
  const browser = await chromium.launch({ headless: true });
  const items = ['Orchard home', 'Mountain hotel', 'Valley land'].map((title, index) => ({
    id: String(index), slug: `fixture-${index}`, title, category: 'HOTEL', purpose: 'SALE',
    description: 'A property in Manali with mountain views.', priceMode: 'PRICE_ON_REQUEST',
    currency: 'INR', priceMinor: null, areaValue: null, areaUnit: null, locality: 'Manali', city: 'Manali',
    amenities: [], verificationStatus: 'UNVERIFIED', media: [],
  }));
  try {
    for (const width of [320, 390, 768, 1024, 1440]) {
      const touch = width <= 1024;
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: touch, hasTouch: touch, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage();
        await page.route('**/api/v1/properties?*', route => route.fulfill({ json: { items, pagination: { page: 1, total: 3, totalPages: 1 } } }));
        await page.route('**/api/v1/site/**', route => route.fulfill({ json: {} }));
        await page.goto('http://localhost:3000/');
        const slider = page.locator('.featured-slider');
        const stage = slider.locator('.featured-stage');
        const currentTitle = slider.locator('.featured-slide[aria-hidden="false"] h3');
        await stage.scrollIntoViewIfNeeded();
        await stage.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(() => document.querySelector('.featured-slide[aria-hidden="false"] h3')?.textContent === 'Mountain hotel');
        assert.equal(await currentTitle.innerText(), 'Mountain hotel');
        const box = await stage.boundingBox();
        const x = box.x + box.width * 0.85;
        const y = Math.max(10, Math.min(850, box.y + 100));
        if (touch) {
          const client = await context.newCDPSession(page);
          await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
          for (let step = 1; step <= 8; step++) {
            await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - step * box.width * 0.7 / 8, y }] });
            await page.waitForTimeout(25);
          }
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        } else {
          await page.mouse.move(x, y);
          await page.mouse.down();
          await page.mouse.move(x - box.width * 0.45, y, { steps: 12 });
          await page.mouse.up();
        }
        await page.waitForTimeout(900);
        await page.waitForFunction(() => document.querySelector('.featured-slide[aria-hidden="false"] h3')?.textContent === 'Valley land', {}, { timeout: 3000 });
        assert.equal(new URL(page.url()).pathname, '/', 'Dragging must not open a property link');
        await slider.getByRole('button', { name: 'Show Mountain hotel' }).click();
        assert.equal(await currentTitle.innerText(), 'Mountain hotel');
        await page.setViewportSize({ width: width + 40, height: 700 });
        await page.waitForFunction(() => {
          const element = document.querySelector('.featured-stage');
          return Math.abs(element.scrollLeft - element.clientWidth) < 2;
        });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No page overflow');
        console.log(`PASS ${width}px: keyboard, ${touch ? 'touch swipe' : 'mouse drag'}, indicators and resizing`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
