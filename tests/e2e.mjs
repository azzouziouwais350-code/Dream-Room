// Tests navigateur (Playwright + Chromium). Usage : node tests/e2e.mjs [baseURL]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) { try { pw = require(p); break; } catch (e) { /* suivant */ } }
const { chromium } = pw;
const BASE = process.argv[2] || 'http://localhost:4173/';
const results = []; const errors = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : ' ' + extra)); };
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 700 }, ...opts });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  return { ctx, page };
}
const G = (page, fn, arg) => page.evaluate(fn, arg);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { ok, newPage, G, sleep, browser, BASE, results, errors };
