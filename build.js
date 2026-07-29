#!/usr/bin/env node
/**
 * Builds the standalone prototype: app.html (template) -> index.html
 *
 * Inlines everything so the output is a single self-contained file:
 *   - Articulat CF woff2 faces (base64)  -> /*__FONTS__*\/
 *   - Untitled UI icon paths             -> /*__ICONS__*\/
 *   - Loop logo / account icon / flags   -> /*__ASSETS__*\/
 *
 * Sources (read-only):
 *   fonts + brand svg   ~/Downloads/Accounts demo with add and edit flows/
 *   icons               ~/Documents/next-app/node_modules/@untitledui/icons/dist
 *
 * Usage: node build.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const DEMO = path.join(HOME, 'Downloads', 'Accounts demo with add and edit flows');
const ICON_DIR = path.join(HOME, 'Documents', 'next-app', 'node_modules', '@untitledui', 'icons', 'dist');
const HERE = __dirname;

/* ---------------------------------------------------------------- fonts --- */
// Articulat CF has no 600; the browser maps font-weight:600 to Bold, which is
// exactly what the real app does (same @font-face set).
const FACES = [
  ['ArticulatCF-Light.woff2', 300],
  ['ArticulatCF-Regular.woff2', 400],
  ['ArticulatCF-Medium.woff2', 500],
  ['ArticulatCF-Bold.woff2', 700],
];

const fontCss = FACES.map(([file, weight]) => {
  const b64 = fs.readFileSync(path.join(DEMO, 'fonts', file)).toString('base64');
  return `@font-face{font-family:'Articulat CF';font-style:normal;font-weight:${weight};font-display:swap;` +
    `src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}).join('\n');

/* ---------------------------------------------------------------- icons --- */
// Every @untitledui/icons module is a single React component whose children are
// <path d="..."> elements; pull the `d` values straight out of the ESM build.
const ICON_NAMES = [
  // sidebar
  'Grid01', 'Bank', 'CreditCard02', 'Send01', 'File05', 'Dataflow03', 'Repeat01',
  'Gift01', 'Plane', 'TrendUp01', 'Settings02',
  // chrome + controls
  'ChevronDown', 'ChevronUp', 'ChevronRight', 'ChevronSelectorVertical', 'Plus',
  'XClose', 'Check', 'CheckCircle', 'InfoCircle', 'HelpCircle', 'AlertCircle',
  'DotsVertical', 'ArrowNarrowLeft', 'Edit02', 'Copy01', 'Link03', 'Lock01',
  'Sun', 'Moon01', 'Monitor01', 'LogOut01', 'Sliders02', 'RefreshCcw01', 'SearchMd',
  // accounts
  'BankNote01', 'CoinsSwap01', 'ArrowCircleBrokenUpRight', 'File02', 'FileCheck02',
  'Download01', 'ShieldTick', 'PiggyBank01',
  'LineChartUp01', 'Percent03', 'CalendarCheck01', 'Coins03', 'MessageChatCircle',
  'ArrowNarrowRight', 'TrendDown01',
];

const icons = {};
for (const name of ICON_NAMES) {
  const file = path.join(ICON_DIR, `${name}.mjs`);
  if (!fs.existsSync(file)) throw new Error(`icon not found: ${name}`);
  const src = fs.readFileSync(file, 'utf8');
  const ds = [...src.matchAll(/d:"([^"]+)"/g)].map(m => m[1]);
  if (!ds.length) throw new Error(`no path data in icon: ${name}`);
  icons[name] = ds.map(d => `<path d="${d}"/>`).join('');
}

/* --------------------------------------------------------------- assets --- */
const dataUri = file => 'data:image/svg+xml;base64,' + fs.readFileSync(file).toString('base64');

const assets = {
  logo: dataUri(path.join(DEMO, 'assets', 'loop-logo.svg')),
  accountIcon: dataUri(path.join(DEMO, 'assets', 'loop-account-icon.svg')),
  flags: {
    CAD: dataUri(path.join(DEMO, 'assets', 'flags', 'ca.svg')),
    USD: dataUri(path.join(DEMO, 'assets', 'flags', 'us.svg')),
    EUR: dataUri(path.join(DEMO, 'assets', 'flags', 'eu.svg')),
    GBP: dataUri(path.join(DEMO, 'assets', 'flags', 'gb.svg')),
  },
};

/* ---------------------------------------------------------------- build --- */
const template = fs.readFileSync(path.join(HERE, 'app.html'), 'utf8');

const replaceOnce = (src, marker, value) => {
  if (!src.includes(marker)) throw new Error(`marker missing in app.html: ${marker}`);
  return src.replace(marker, value);
};

let out = template;
out = replaceOnce(out, '/*__FONTS__*/', fontCss);
// the `{}` after each marker is the template's placeholder value — it gets
// replaced along with the marker so the result is a single initializer.
out = replaceOnce(out, '/*__ICONS__*/{}', JSON.stringify(icons));
out = replaceOnce(out, '/*__ASSETS__*/{}', JSON.stringify(assets));

fs.writeFileSync(path.join(HERE, 'index.html'), out);
console.log(
  `index.html written — ${(out.length / 1024).toFixed(0)}kB ` +
  `(${FACES.length} fonts, ${ICON_NAMES.length} icons)`
);
