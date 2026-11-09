// Renders the app icons from inline SVG with Playwright's Chromium.
// Usage: node scripts/generate-icons.mjs  (writes public/icons/*.png)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const YELLOW = '#f5be0b';
const INK = '#2a2414';
const OUT = 'public/icons';

// Rounded tile for "any" purpose icons (transparent corners).
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${YELLOW}"/>
  <path d="M18 33l9 9 19-20" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Full-bleed square: maskable (Android crops it) and Apple touch icon (iOS rounds it).
// The check sits inside the central 80% safe zone.
const fullBleed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${YELLOW}"/>
  <path d="M22 33.5l7 7 14.5-15.5" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const targets = [
  ['icon-192.png', 192, rounded],
  ['icon-512.png', 512, rounded],
  ['maskable-512.png', 512, fullBleed],
  ['apple-touch-icon.png', 180, fullBleed],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {},
);
const page = await browser.newPage();
for (const [name, size, svg] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.screenshot({ path: `${OUT}/${name}`, omitBackground: true });
  console.log('wrote', name);
}
await browser.close();
