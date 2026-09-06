// Visual check harness: drives the dev server in a real Chrome at phone size.
// Usage: node scripts/shot.mjs [outDir]
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = process.argv[2] ?? '.screens';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
});
const page = await browser.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

const overflow = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const wide = [...document.querySelectorAll('*')]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.right > vw + 0.5)
    .map(
      ({ el, r }) =>
        `${el.tagName.toLowerCase()}.${el.className || '-'} right=${r.right.toFixed(0)}`,
    );
  return { vw, docWidth: document.documentElement.scrollWidth, wide: wide.slice(0, 8) };
});
console.log(JSON.stringify(overflow, null, 2));

await page.screenshot({ path: `${out}/empty.png` });
await page.type('input[type=search]', 'bow');
await page.click('.result');
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${out}/target.png` });

// Light mode is a supported theme, not an afterthought — check it every run.
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
await page.screenshot({ path: `${out}/target-light.png` });

await browser.close();
