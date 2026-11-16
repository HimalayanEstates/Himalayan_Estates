const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let submitted;
    const property = { id: 'cm00000000000000000000001', slug: 'reference-estate', title: 'A Manali Estate', category: 'HOTEL', purpose: 'SALE', description: 'A property overlooking the Manali valley.\n\nSpeak to our local team for a personal viewing.', priceMode: 'FIXED', priceMinor: '18500000000', priceMaxMinor: null, currency: 'INR', areaValue: 22000, areaUnit: 'sq ft', locality: 'Solang', city: 'Manali', amenities: ['Private garden', 'Valley view'], verificationStatus: 'UNVERIFIED', media: Array.from({ length: 6 }, (_, index) => ({ deliveryUrl: `/images/estate-${index}.jpg`, altText: `Estate photograph ${index + 1}`, caption: `View ${index + 1}`, isCover: index === 0, moderationState: 'APPROVED', mediaType: 'IMAGE' })) };
    await page.route('**/api/v1/properties/reference-estate', route => route.fulfill({ json: { property } }));
    await page.route('**/api/v1/site/**', route => route.fulfill({ json: {} }));
    await page.route('**/api/v1/inquiries', route => { submitted = route.request().postDataJSON(); return route.fulfill({ status: 201, json: { inquiry: { id: 'test' } } }); });
    await page.goto('http://localhost:3000/properties/reference-estate');
    await page.getByRole('heading', { level: 1, name: property.title }).waitFor();
    assert.equal(await page.locator('.estate-photo').count(), 5);
    assert.equal(await page.getByText('Section 118 Ready', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Verified listing', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'View all 6 photographs' }).click();
    const dialog = page.getByRole('dialog', { name: `Photography of ${property.title}` });
    await dialog.waitFor();
    for (let index = 0; index < 5; index++) await dialog.getByRole('button', { name: 'Next photograph' }).click();
    assert.equal(await dialog.locator('img').getAttribute('alt'), 'Estate photograph 6');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await dialog.locator('img').getAttribute('alt'), 'Estate photograph 5');
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(), false);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px overflow`);
    }
    await page.getByRole('link', { name: 'Request property brief', exact: true }).click();
    const form = page.locator('.inquiry-panel form');
    await form.locator('[name=name]').fill('Test visitor');
    await form.locator('[name=email]').fill('visitor@example.com');
    assert.equal(await form.locator('[name=phone]').count(), 0);
    await form.locator('[name=message]').fill('Please send the property brief and viewing options.');
    await form.locator('[name=consent]').check();
    await form.getByRole('button', { name: 'Begin the conversation' }).click();
    await page.getByText('Your enquiry is with us.').waitFor();
    assert.equal(submitted.propertyId, property.id);
    assert.equal(submitted.email, 'visitor@example.com');
    property.media = [];
    await page.reload();
    await page.getByRole('heading', { name: 'Photography on request.', exact: true }).waitFor();
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS gallery, keyboard controls, accurate verification display, four viewport widths, inquiry and no-photo state');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
