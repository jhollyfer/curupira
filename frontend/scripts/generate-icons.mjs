/**
 * Generates the binary icons of `public/` from `public/favicon.svg`, and the link
 * preview (`og-image.png`). One command when the mark changes:
 *
 *   node scripts/generate-icons.mjs
 *
 * Why Chromium and not an image library: the project has no image dependency, and the
 * browser the e2e suite already needs renders the SVG exactly as users see it. The
 * binaries are versioned (they are served as static files and the build does not make
 * them). Set `E2E_CHROMIUM_PATH` when the browser is not where Playwright expects it.
 *
 * Outputs: favicon.ico (48, PNG inside), apple-touch-icon.png (180), icon-192.png,
 * icon-512.png, icon-maskable-512.png (mark in the 80% safe zone, solid background),
 * og-image.png (1200x630).
 */

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const GREEN = '#1f6b3d'
const PAPER = '#f6faf7'
const STAGE = '#133a24'

const svg = await readFile(join(PUBLIC, 'favicon.svg'), 'utf8')
const mark = (size, padding = 0) =>
  `<div style="width:${size}px;height:${size}px;background:${padding ? GREEN : 'transparent'};display:grid;place-items:center"><div style="width:${size - padding * 2}px;height:${size - padding * 2}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></div>`

const browser = await chromium.launch({
  executablePath: process.env.E2E_CHROMIUM_PATH,
})
const page = await browser.newPage()

async function shot(html, width, height, transparent = false) {
  await page.setViewportSize({ width, height })
  await page.setContent(
    `<body style="margin:0;background:${transparent ? 'transparent' : PAPER}">${html}</body>`,
  )

  return await page.screenshot({ omitBackground: transparent })
}

/** An `.ico` with one PNG image: every browser that still asks for it reads this. */
function ico(png, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size, 0)
  entry.writeUInt8(size, 1)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(header.length + entry.length, 12)

  return Buffer.concat([header, entry, png])
}

const out = (name, data) => writeFile(join(PUBLIC, name), data)

const png48 = await shot(mark(48), 48, 48, true)
await out('favicon.ico', ico(png48, 48))
await out(
  'apple-touch-icon.png',
  await shot(mark(180, 0).replace('transparent', GREEN), 180, 180),
)
await out('icon-192.png', await shot(mark(192), 192, 192, true))
await out('icon-512.png', await shot(mark(512), 512, 512, true))
// Maskable: the mark inside the 80% safe zone over a solid green square, so any
// platform mask (circle, squircle) crops only background.
await out('icon-maskable-512.png', await shot(mark(512, 102), 512, 512))

await out(
  'og-image.png',
  await shot(
    `<div style="width:1200px;height:630px;background:${STAGE};color:#f2faf4;font-family:system-ui,sans-serif;display:flex;align-items:center;gap:56px;padding:0 96px;box-sizing:border-box">
       <div style="width:220px;height:220px;flex:none">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
       <div><div style="font-size:84px;font-weight:800;letter-spacing:-2px">Curupira</div>
       <div style="font-size:40px;margin-top:16px;color:#c3dccb;max-width:720px;line-height:1.25">Coleta de lixo e denúncia ambiental em Benjamin Constant</div></div>
     </div>`,
    1200,
    630,
  ),
)

await browser.close()
