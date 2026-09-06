/**
 * Verifies a production build works under a subpath, the way GitHub Pages serves it.
 * Catches the classic Pages failures: absolute asset URLs, a service worker whose
 * scope doesn't match, and a manifest the browser can't fetch.
 *
 * Usage: BASE_PATH=/msm-helper/ npm run build && node scripts/check-build.mjs
 */
import { spawn } from 'node:child_process';
import { cp, rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const REPO = 'msm-helper';
const PORT = 8099;

const root = await mkdtemp(join(tmpdir(), 'msm-pages-'));
await cp('dist', join(root, REPO), { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: root });
await new Promise((r) => setTimeout(r, 800));

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
});
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push(`FAILED ${r.url()}`));

await page.goto(`http://localhost:${PORT}/${REPO}/`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1200)); // let the service worker register

// Results only render once there's a query, so drive a real search.
await page.type('input[type=search]', 'bow');
await new Promise((r) => setTimeout(r, 200));

const info = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  const manifestHref = document.querySelector('link[rel=manifest]')?.href;
  const manifestOk = manifestHref
    ? await fetch(manifestHref).then((r) => r.ok).catch(() => false)
    : false;
  return {
    title: document.title,
    monstersListed: document.querySelectorAll('.result').length,
    swScope: reg?.scope ?? null,
    manifestHref,
    manifestOk,
  };
});

await page.screenshot({ path: '.screens/pages.png' });
await browser.close();
server.kill();
await rm(root, { recursive: true, force: true });

console.log(JSON.stringify({ ...info, errors }, null, 2));

const failures = [];
if (info.monstersListed === 0) failures.push('search returned no monsters');
if (!info.swScope?.endsWith(`/${REPO}/`)) failures.push(`bad SW scope: ${info.swScope}`);
if (!info.manifestOk) failures.push('manifest not fetchable');
if (errors.length) failures.push(`console errors: ${errors.join('; ')}`);

if (failures.length) {
  console.error('\nFAIL\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('\nOK — subpath build is servable, SW scoped, manifest reachable.');
