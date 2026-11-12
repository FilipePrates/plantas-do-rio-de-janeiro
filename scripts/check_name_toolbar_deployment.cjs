const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createHash } = require('node:crypto');
const { chromium } = require('../../plantas-rio-content-editor/node_modules/playwright-core');
const artifactRoot = path.resolve(process.argv[2]);
const stage = process.argv[3] || 'local';
assert.ok(['local', 'live'].includes(stage));
const directory = process.env.PLANT_EXPORT_DIRECTORY ? path.resolve(process.env.PLANT_EXPORT_DIRECTORY) : path.join(artifactRoot, 'source/dist/web');
const verification = JSON.parse(fs.readFileSync(path.join(artifactRoot, 'export-verification.json'), 'utf8'));
const artifacts = path.join(artifactRoot, stage);
fs.mkdirSync(artifacts, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function assertScientificStyle(page, locator) {
  let actual;
  for (let attempt = 0; attempt < 50; attempt++) {
    await locator.waitFor();
    actual = await locator.evaluate(el => ({ weight: getComputedStyle(el).fontWeight, style: getComputedStyle(el).fontStyle }));
    if (actual.weight === '400' && actual.style === 'italic') return;
    await page.waitForTimeout(100);
  }
  assert.deepEqual(actual, { weight: '400', style: 'italic' });
}
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
let server;
(async () => {
  if (stage === 'local') {
    server = http.createServer((req, res) => {
      let file = path.resolve(directory, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!file.startsWith(directory + path.sep) && file !== directory) { res.writeHead(403).end(); return; }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(directory, 'index.html');
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    });
    await new Promise(resolve => server.listen(8893, '127.0.0.1', resolve));
  }
  const url = stage === 'local' ? 'http://127.0.0.1:8893/' : 'https://plantas.avesdobrasil.app/';
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const errors = [], failedAssets = [], widths = [];
  try {
    for (const width of [1024, 1440, 1920, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(String(e)));
      page.on('response', r => { if (new URL(r.url()).origin === new URL(url).origin && r.status() >= 400) failedAssets.push({ url: r.url(), status: r.status() }); });
      const response = await page.goto(url + '?tab=families', { waitUntil: 'domcontentloaded', timeout: 120000 });
      assert.equal(response.status(), 200);
      const html = await response.text();
      for (const bundle of verification.bundles) {
        assert.ok(html.includes(bundle.path), 'HTML references the verified bundle');
        const asset = await context.request.get(new URL(bundle.path, url).href);
        assert.equal(asset.status(), 200);
        assert.equal(hash(await asset.body()), bundle.sha256, 'Served bundle matches the verified export');
      }
      if (width >= 1024) {
        const root = page.getByTestId('desktop-catalog-browser');
        await root.waitFor();
        for (const [name, prompt] of [['Famílias', 'Buscar família…'], ['Espécies', 'Buscar espécie, família ou unidade…'], ['Unidades de Conservação', 'Buscar unidade de conservação…']]) {
          await root.getByRole('tab', { name, exact: true }).click();
          const input = await root.getByRole('textbox', { name: prompt, exact: true }).boundingBox();
          const tabs = await root.getByRole('tablist').boundingBox();
          assert.ok(Math.abs(input.y + input.height / 2 - tabs.y - tabs.height / 2) < 3);
          assert.ok(input.width >= 150 && input.x + input.width <= tabs.x && tabs.x + tabs.width <= width);
        }
        await root.getByRole('tab', { name: 'Famílias', exact: true }).click();
        const search = root.getByRole('textbox', { name: 'Buscar família…', exact: true });
        await search.fill('Bromeliaceae');
        const card = root.getByTestId('desktop-family-Bromeliaceae'); await card.waitFor();
        assert.equal(await root.locator('[data-testid^="desktop-family-"]:visible').count(), 1);
        assert.ok((await card.boundingBox()).y < 130);
        await card.click();
        await root.getByRole('button', { name: 'Voltar às famílias' }).click();
        assert.equal(await search.inputValue(), 'Bromeliaceae');
      } else {
        const search = page.getByRole('textbox', { name: 'Buscar família…', exact: true }); await search.waitFor();
        assert.equal(await page.getByTestId('desktop-catalog-browser').count(), 0);
        const tabs = await page.getByRole('tab', { name: 'Unidades de Conservação', exact: true }).boundingBox();
        assert.ok((await search.boundingBox()).y >= tabs.y + tabs.height);
      }
      await page.screenshot({ path: path.join(artifacts, `catalog-${width}.png`) });
      await page.goto(url + '?q=Aechmea%20nudicaulis', { waitUntil: 'domcontentloaded' });
      const card = page.getByTestId('plant-grid-aechmea-nudicaulis'); await card.waitFor();
      await assertScientificStyle(page, card.getByText('Aechmea nudicaulis', { exact: true }));
      await card.click(); await page.getByText('Descrição', { exact: true }).waitFor();
      const name = page.getByTestId(width >= 1024 ? 'profile-sticky-names' : 'profile-identity-details').getByText('Aechmea nudicaulis', { exact: true });
      assert.equal(await name.count(), 1);
      await assertScientificStyle(page, name);
      await page.waitForFunction(() => { const image = document.querySelector('[data-testid="profile-photo-gallery"] img'); return image?.complete && image.naturalWidth > 0; });
      await page.reload({ waitUntil: 'domcontentloaded' }); await name.waitFor();
      await page.screenshot({ path: path.join(artifacts, `profile-${width}.png`) });
      if (process.env.PLANT_CHECK_NAVIGATION === '1') {
        await page.goto(url + '?plant=euterpe-edulis&tab=guide', { waitUntil: 'domcontentloaded' });
        const scroller = page.getByTestId('plant-profile-scroll'); await scroller.waitFor();
        await page.waitForFunction(() => history.state?.plantRoute?.plantId === 'euterpe-edulis' && location.search.includes('names='));
        const setScroll = async () => {
          await page.waitForFunction(() => {
            const el = document.querySelector('[data-testid="plant-profile-scroll"]');
            return el && el.scrollHeight - el.clientHeight > 80;
          });
          return scroller.evaluate(el => { el.scrollTop = Math.min(360, el.scrollHeight - el.clientHeight); return el.scrollTop; });
        };
        const firstTop = await setScroll();
        const firstUrl = page.url();
        if (width >= 1024) await page.getByRole('button', { name: 'Próxima ficha', exact: true }).click();
        else await page.getByRole('tab', { name: 'Guia', exact: true }).click();
        await page.waitForFunction(first => location.href !== first, firstUrl);
        const secondUrl = page.url();
        const secondTop = width >= 1024 ? await setScroll() : 0;
        if (width >= 1024) await page.waitForFunction(top => history.state?.profileScrollTop >= top - 2, secondTop);
        await page.goBack();
        await page.waitForFunction(({ href, top }) => {
          const el = document.querySelector('[data-testid="plant-profile-scroll"]');
          return location.href === href && el && Math.abs(el.scrollTop - top) < 3;
        }, { href: firstUrl, top: firstTop }).catch(async error => {
          console.log(JSON.stringify({ width, firstUrl, firstTop, secondUrl, secondTop, current: await page.evaluate(() => ({ url: location.href, state: history.state, scroll: document.querySelector('[data-testid="plant-profile-scroll"]')?.scrollTop, max: (() => { const el = document.querySelector('[data-testid="plant-profile-scroll"]'); return el && el.scrollHeight - el.clientHeight; })() })) }));
          throw error;
        });
        await page.goForward();
        await page.waitForFunction(({ href, top, mobile }) => {
          const el = document.querySelector('[data-testid="plant-profile-scroll"]');
          return location.href === href && (mobile ? !el : el && Math.abs(el.scrollTop - top) < 3);
        }, { href: secondUrl, top: secondTop, mobile: width < 1024 });
        await page.reload({ waitUntil: 'domcontentloaded' });
        if (width >= 1024) await page.waitForFunction(top => {
          const el = document.querySelector('[data-testid="plant-profile-scroll"]');
          return el && Math.abs(el.scrollTop - top) < 3;
        }, secondTop);
        await page.goBack();
        await page.waitForFunction(href => location.href === href, firstUrl);
        const unitLink = scroller.locator('a[href*="uc="]').first();
        if (await unitLink.count()) {
          await unitLink.scrollIntoViewIfNeeded();
          const top = await scroller.evaluate(el => el.scrollTop);
          const href = await unitLink.getAttribute('href');
          await unitLink.click();
          await page.waitForFunction(() => new URLSearchParams(location.search).has('uc') && !new URLSearchParams(location.search).has('plant'));
          await page.goBack();
          await page.waitForFunction(({ href, top }) => {
            const el = document.querySelector('[data-testid="plant-profile-scroll"]');
            return location.href === href && el && Math.abs(el.scrollTop - top) < 3;
          }, { href: firstUrl, top });
          const fresh = await context.newPage();
          await fresh.goto(new URL(href, url).href, { waitUntil: 'domcontentloaded' });
          await fresh.locator('[data-testid^="plant-grid-"]').first().waitFor();
          await fresh.close();
        }
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      widths.push(width); await context.close(); console.log(`PASS ${stage} ${width}`);
    }
    assert.deepEqual(errors, []); assert.deepEqual(failedAssets, []);
    const result = { stage, url, widths, exactHtmlReferencedBundleHashes: true, desktopSingleRowToolbar: true, familySearchAndReturn: true, scientificNamesRegularItalic: true, singleScientificProfileHeading: true, profileReloadAndPhotos: true, mobileLayoutPreserved: true, browserNavigationScrollRestoration: process.env.PLANT_CHECK_NAVIGATION === '1', pageErrors: errors, failedAssets };
    fs.writeFileSync(path.join(artifacts, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => server?.close());
