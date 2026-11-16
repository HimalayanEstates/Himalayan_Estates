const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// Run against the local frontend; API fixtures prevent changes to real inquiries.
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const items = ['Orchard home', 'Mountain hotel', 'Valley land'].map((title, index) => ({
      id: `fixture-${index}`, slug: `fixture-${index}`, title, category: 'HOTEL', purpose: 'SALE',
      description: 'A property in Manali with mountain views.', priceMode: 'PRICE_ON_REQUEST',
      currency: 'INR', priceMinor: null, priceMaxMinor: null, areaValue: null, areaUnit: null,
      locality: 'Manali', city: 'Manali', amenities: [], verificationStatus: 'UNVERIFIED', media: [{ deliveryUrl: `/images/estate-${index}.jpg`, altText: title, isCover: true }],
    }));
    let submitted;
    await page.route('**/api/v1/properties?*', route => route.fulfill({ json: { items, pagination: { page: 1, total: 3, totalPages: 1 } } }));
    await page.route('**/api/v1/site/**', route => route.fulfill({ json: {} }));
    await page.route('**/api/v1/inquiries', route => {
      submitted = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { inquiry: { id: 'fixture' } } });
    });
    await page.clock.install();
    // Native smooth scrolling uses the browser clock; make position changes deterministic with mocked timers.
    await page.addInitScript(() => {
      const scrollTo = Element.prototype.scrollTo;
      Element.prototype.scrollTo = function (options, y) {
        return typeof options === 'object' ? scrollTo.call(this, { ...options, behavior: 'instant' }) : scrollTo.call(this, options, y);
      };
    });
    await page.goto('http://localhost:3000/');
    const slider = page.locator('.featured-slider');
    await slider.waitFor();
    await slider.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.featured-slider').getBoundingClientRect().top < innerHeight);
    await page.clock.runFor(200);
    await new Promise(resolve => setTimeout(resolve, 150));
    await page.clock.runFor(5200);
    assert.equal(await slider.locator('.featured-slide[aria-hidden="false"] h3').innerText(), 'Mountain hotel', 'Autoplay advances after five seconds');
    assert.equal(await slider.getByRole('button', { name: 'Stop sliding' }).evaluate(element => element.getBoundingClientRect().width), 1, 'Rotation control is hidden until keyboard focus');
    await slider.getByRole('button', { name: 'Stop sliding' }).focus();
    await page.keyboard.press('Space');
    await page.clock.runFor(6000);
    assert.equal(await slider.locator('.featured-slide[aria-hidden="false"] h3').innerText(), 'Mountain hotel', 'Pause stops autoplay');
    assert.equal(await slider.getByRole('button', { name: /^(Previous|Next) featured property$/ }).count(), 0);
    await slider.getByRole('button', { name: 'Show Valley land' }).click();
    assert.equal(await slider.locator('.featured-slide[aria-hidden="false"] h3').innerText(), 'Valley land');
    await slider.getByRole('button', { name: 'Show Mountain hotel' }).click();
    assert.equal(await slider.locator('.featured-slide[aria-hidden="false"] h3').innerText(), 'Mountain hotel');
    await slider.getByRole('button', { name: 'Resume sliding' }).focus();
    await page.keyboard.press('Space');
    await slider.scrollIntoViewIfNeeded();
    await page.clock.runFor(200);
    await new Promise(resolve => setTimeout(resolve, 150));
    await page.clock.runFor(5200);
    assert.equal(await slider.locator('.featured-slide[aria-hidden="false"] h3').innerText(), 'Valley land', 'Play resumes autoplay');
    console.log('PASS automatic sliding, stop/resume and indicators; top arrows removed');
    await page.clock.runFor(800);
    await slider.locator('.featured-stage').dispatchEvent('pointerdown');
    await slider.locator('.featured-stage').dispatchEvent('pointerup');
    await slider.locator('.featured-stage').evaluate(element => element.scrollTo({ left: 0, behavior: 'instant' }));
    await page.clock.runFor(400);
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal(await slider.locator('.featured-slide[aria-hidden="false"] h3').innerText(), 'Orchard home', 'Native scrolling updates the current slide');
    assert.equal(await slider.getByRole('button', { name: 'Stop sliding' }).count(), 1, 'Touch interaction does not permanently stop autoplay');
    await slider.locator('.featured-stage').evaluate(element => element.blur());
    await page.mouse.move(0,0);
    await page.clock.runFor(200);
    await new Promise(resolve => setTimeout(resolve, 150));
    await page.clock.runFor(5200);
    assert.equal(await slider.locator('.featured-slide[aria-hidden="false"] h3').innerText(), 'Mountain hotel', 'Autoplay resumes after touch interaction');
    console.log('PASS native swipe scroll synchronization');

    const form = page.locator('.inquiry-panel form');
    assert.equal(await form.locator('[name=phone]').count(), 0);
    assert.equal(await form.locator('[name=email]').count(), 1);
    for (const method of ['PHONE', 'WHATSAPP']) {
      await form.locator('[name=preferredContact]').selectOption(method);
      assert.equal(await form.locator('[name=email]').count(), 0);
      assert.equal(await form.locator('[name=phone]').count(), 1);
    }
    await form.locator('[name=name]').fill('Test visitor');
    await form.locator('[name=phone]').fill('9999999999');
    await form.locator('[name=message]').fill('Please share the property details.');
    await form.locator('[name=consent]').check();
    await form.getByRole('button', { name: 'Begin the conversation' }).click();
    await page.getByText('Your enquiry is with us.').waitFor();
    assert.equal(submitted.preferredContact, 'WHATSAPP');
    assert.equal(submitted.phone, '9999999999');
    assert.equal('email' in submitted, false, 'Hidden email is omitted from submission');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await slider.getByRole('button', { name: 'Resume sliding' }).waitFor();
    console.log('PASS conditional contact fields, submission and reduced-motion pause');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
