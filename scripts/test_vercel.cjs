const puppeteer = require('puppeteer');

const targetUrl = process.env.TEST_URL?.trim();
const testEmail = process.env.TEST_EMAIL?.trim();
const testPassword = process.env.TEST_PASSWORD;

const missingVariables = Object.entries({
  TEST_URL: targetUrl,
  TEST_EMAIL: testEmail,
  TEST_PASSWORD: testPassword,
})
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingVariables.length > 0) {
  throw new Error(`Configure as variáveis de ambiente: ${missingVariables.join(', ')}`);
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));

  console.log('Navigating to test site...');
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });

  // Type credentials
  console.log('Filling form...');
  await page.type('input[type="email"]', testEmail);
  await page.type('input[type="password"]', testPassword);

  // Click login
  console.log('Clicking login...');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 4000));

  const content = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT AFTER LOGIN ATTEMPT:\n', content);

  await browser.close();
})();
