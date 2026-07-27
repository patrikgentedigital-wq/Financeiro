const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', response => {
    if (!response.ok()) console.log('404 URL:', response.url());
  });
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  const content = await page.content();
  console.log('CONTENT START\n', content.substring(0, 1000), '\nCONTENT END');
  await page.screenshot({path: 'screenshot.png'});
  await browser.close();
})();
