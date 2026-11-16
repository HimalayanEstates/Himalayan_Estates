const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    let submitted;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/v1/site/**', route => route.fulfill({ json: {} }));
    await page.route('**/api/v1/inquiries', route => { submitted = route.request().postDataJSON(); return route.fulfill({ status: 201, json: { inquiry: { id: 'fixture' } } }); });
    await page.goto('http://localhost:3000/advisory');
    await page.getByRole('heading', { level: 1 }).waitFor();
    const topics = ['Built-up property', 'Government permission', 'Company transactions', 'Leasehold interests'];
    for (const topic of topics) {
      const tab = page.getByRole('tab', { name: topic, exact: true });
      await tab.click();
      assert.equal(await tab.getAttribute('aria-selected'), 'true');
      assert.equal(await page.getByRole('tabpanel').count(), 1);
    }
    await page.getByRole('tab', { name: topics[3] }).focus();
    await page.keyboard.press('Home');
    assert.equal(await page.getByRole('tab', { name: topics[0] }).getAttribute('aria-selected'), 'true');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getByRole('tab', { name: topics[1] }).getAttribute('aria-selected'), 'true');
    const selects = page.locator('.legal-assessment-fields select');
    await selects.nth(0).selectOption('2');
    await selects.nth(1).selectOption('2');
    await selects.nth(2).selectOption('3');
    assert((await page.locator('.legal-selection-summary').innerText()).includes('NRI / OCI buyer'));
    await page.getByRole('button', { name: 'Use these details in my enquiry' }).click();
    const form = page.locator('.inquiry-panel form');
    await form.locator('[name=name]').fill('Test visitor');
    await form.locator('[name=email]').fill('visitor@example.com');
    assert.equal(await form.locator('[name=phone]').count(), 0);
    await form.locator('[name=message]').fill('I would like to discuss the documents for this property.');
    await form.locator('[name=consent]').check();
    await form.getByRole('button', { name: 'Begin the conversation' }).click();
    await page.getByText('Your enquiry is with us.').waitFor();
    assert.equal(submitted.source, 'section118-advisory');
    for (const value of ['NRI / OCI buyer', 'Land or orchard', 'Solang area']) assert(submitted.message.includes(value));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px overflow`);
    }
    await page.goto('http://localhost:3000/privacy');
    assert.equal(await page.locator('#section-118 .section118-preview-grid>div').count(), 2);
    const fullGuide = page.locator('#section-118').getByRole('link');
    assert.equal(await fullGuide.getAttribute('href'), '/advisory');
    await fullGuide.click();
    await page.waitForURL('http://localhost:3000/advisory');
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS tabs, keyboard navigation, review brief, CRM payload, responsive layouts and policy-to-advisory navigation');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
