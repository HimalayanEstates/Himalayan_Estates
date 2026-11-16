const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const page = await browser.newPage();
 const failures=[];page.on('pageerror',e=>failures.push(e.message));
 let inquiry;
 await page.route('**/api/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  const property={id:'cltestproperty000000000001',slug:'test-lodge',title:'Mountain Lodge',category:'HOTEL',purpose:'SALE',description:'A mountain property used only for browser verification.',priceMode:'FIXED',priceMinor:'125000000',priceMaxMinor:null,currency:'INR',areaValue:2400,areaUnit:'sq ft',locality:'Old Manali',city:'Manali',amenities:['Garden'],verificationStatus:'VERIFIED',media:[]};
  let body={};
  if(path.endsWith('/inquiries')){inquiry=route.request().postDataJSON();assert.ok(route.request().headers()['idempotency-key']);body={inquiry:{id:'test',status:'NEW'}};}
  else if(path.endsWith('/properties/test-lodge'))body={property};
  else if(path.endsWith('/properties'))body={items:[property],pagination:{page:1,total:1,totalPages:1,hasMore:false}};
  await route.fulfill({json:body,headers:{'Access-Control-Allow-Origin':'*'}});
 });
 await page.goto('http://localhost:3100');
 await page.getByRole('region',{name:'Featured estates.'}).getByRole('heading',{name:'Mountain Lodge',exact:true}).waitFor();
 const slider = page.getByRole('region',{name:'Featured estates.'});
 assert.equal(await slider.locator('.slider-count').innerText(), '01 / 01');
 await slider.getByRole('button',{name:'Next featured property'}).click();
 assert.equal(await slider.locator('.slider-count').innerText(), '01 / 01');
 assert.match(await page.locator('.search-panel').evaluate(el=>getComputedStyle(el).backdropFilter),/blur/);
 await page.locator('.contact-section').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('.contact-section').dataset.reveal==='visible');
 for(const width of [1440,768,375]){await page.setViewportSize({width,height:950});await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=window.innerHeight/2){window.scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,80));}window.scrollTo(0,0);});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);await page.screenshot({path:`${process.env.TEMP}/he-ui-${width}.png`,fullPage:true});}
 await page.getByRole('button',{name:'Toggle navigation'}).click();assert.equal(await page.locator('#navigation').isVisible(),true);
 await page.getByRole('button',{name:'Toggle navigation'}).click();
 await page.locator('input[name=name]').fill('Browser Check');await page.locator('input[name=email]').fill('check@example.com');await page.locator('textarea[name=message]').fill('I would like to arrange a property viewing.');await page.locator('input[name=consent]').check();await page.getByRole('button',{name:'Begin the conversation'}).click();await page.getByText('Your enquiry is with us.').waitFor();assert.equal(inquiry.consent,true);
 await page.goto('http://localhost:3100/properties/test-lodge');await page.getByRole('heading',{name:'Mountain Lodge',exact:true}).waitFor();assert.equal(await page.locator('input[name=name]').count(),1);
 await page.goto('http://localhost:3100/admin');await page.getByRole('button',{name:'Sign in securely'}).waitFor();
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
 await page.goto('http://localhost:3100');
 assert.equal(await page.locator('[data-reveal=pending]').count(),0);
 assert.equal(await page.locator('.hero-content').evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.deepEqual(failures,[]);await browser.close();console.log('PASS: desktop/tablet/mobile layout, mobile navigation, inquiry submission, dossier, admin sign-in, reduced-motion preference, no browser exceptions.');
})().catch(e=>{console.error(e);process.exit(1)});
