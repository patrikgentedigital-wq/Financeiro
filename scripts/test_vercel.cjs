const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));

  console.log('Navigating to Vercel site...');
  await page.goto('https://financeiro-xi-two.vercel.app', { waitUntil: 'networkidle2' });

  // Type credentials
  console.log('Filling form...');
  await page.type('input[type="email"]', 'patrickfurtado@gmail.com');
  await page.type('input[type="password"]', 'patrick321');

  // Click login
  console.log('Clicking login...');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 4000));

  const content = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT AFTER LOGIN ATTEMPT:\n', content);

  await browser.close();
})();
