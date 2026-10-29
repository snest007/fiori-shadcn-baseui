import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const update = process.argv.includes('--update-baselines')
const captureOnly = process.argv.includes('--capture-only')
const external = process.argv.includes('--external')
const output = path.join(root, 'output/playwright/current')
const baselines = path.join(root, 'output/playwright/baselines', process.platform)
const results = []
const errors = []
const screenshots = []
const servers = []
await fs.mkdir(output, { recursive: true })
if (update) await fs.mkdir(baselines, { recursive: true })
const lab = process.env.FIORI_LAB_URL ?? (external ? 'http://127.0.0.1:4178' : 'http://127.0.0.1:4278')
const consumer = process.env.FIORI_CONSUMER_URL ?? (external ? 'http://127.0.0.1:4188' : 'http://127.0.0.1:4288')
async function waitFor(check, message, timeout = 10000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await check()) return
    await new Promise(resolve => setTimeout(resolve, 80))
  }
  throw new Error(message)
}
async function start(project, port) {
  const processHandle = spawn(process.execPath, [path.join(root, project, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: path.join(root, project), stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  for (const stream of [processHandle.stdout, processHandle.stderr]) stream.on('data', data => { log += data })
  servers.push(processHandle)
  await waitFor(async () => {
    if (processHandle.exitCode !== null) throw new Error(`${project} preview failed: ${log}`)
    try { return (await fetch(`http://127.0.0.1:${port}`)).ok } catch { return false }
  }, `${project} preview unavailable`)
}
function pixelDifference(a, b) {
  if (a.width !== b.width || a.height !== b.height) return 1
  let changed = 0
  for (let i = 0; i < a.data.length; i += 4) {
    if (Math.max(...[0, 1, 2].map(channel => Math.abs(a.data[i + channel] - b.data[i + channel]))) > 12) changed++
  }
  return changed / (a.width * a.height)
}
async function shot(page, name) {
  await page.mouse.move(0, 0)
  await page.evaluate(() => document.fonts.ready)
  const file = path.join(output, `${name}.png`)
  await page.screenshot({ path: file, animations: 'disabled' })
  const baseline = path.join(baselines, `${name}.png`)
  if (update) {
    await fs.copyFile(file, baseline)
    screenshots.push({ name, mode: 'baseline-created' })
  } else if (captureOnly) screenshots.push({ name, mode: 'captured-without-pixel-comparison' })
  else {
    const difference = pixelDifference(PNG.sync.read(await fs.readFile(file)), PNG.sync.read(await fs.readFile(baseline)))
    screenshots.push({ name, mode: 'compared', changedPixelRatio: difference })
    assert.ok(difference <= 0.005, `${name}: ${(100 * difference).toFixed(2)}% pixels differ; review screenshots before updating baseline`)
  }
}
async function check(name, callback) {
  try { await callback(); results.push({ name, passed: true }); console.log(`PASS ${name}`) }
  catch (error) { results.push({ name, passed: false, error: error.message }); throw error }
}
async function settle(page) { await page.waitForTimeout(380) }
async function fit(page, selector) {
  const box = await page.locator(selector).evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth }))
  assert.ok(box.scroll <= box.client + 1, `${selector}: horizontal overflow ${JSON.stringify(box)}`)
}
async function sticky(page) {
  const header = await page.locator('.list-page-header').boundingBox()
  const toolbar = await page.locator('.table-toolbar').boundingBox()
  const column = await page.locator('.orders-table th').first().boundingBox()
  assert.ok(Math.abs(header.y + header.height - toolbar.y) <= 1, 'toolbar must follow measured header')
  assert.ok(Math.abs(toolbar.y + toolbar.height - column.y) <= 1, 'column header must follow toolbar')
}
let browser
let browserVersion
try {
  if (!external) await Promise.all([start('fiori-design-lab', 4278), start('fiori-registry-consumer', 4288)])
  browser = await chromium.launch({ headless: true })
  browserVersion = browser.version()
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${lab}/#/orders`)
  const table = page.getByRole('grid', { name: 'Purchase Orders', exact: true })
  await table.waitFor()
  await check('author compact collapse and screenshot', async () => {
    await page.getByRole('button', { name: 'Compact 密度', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: '展开筛选栏', exact: true }).getAttribute('aria-expanded'), 'false')
    await fit(page, '.page-scroll')
    await shot(page, 'author-compact-collapsed')
  })
  await check('expand, pin and measured sticky stacking', async () => {
    await page.getByRole('button', { name: '展开筛选栏', exact: true }).click()
    await shot(page, 'author-compact-expanded')
    await page.getByRole('button', { name: '固定页头', exact: true }).click()
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop = 400 })
    await settle(page)
    assert.equal(await page.getByRole('button', { name: '取消固定页头', exact: true }).getAttribute('aria-pressed'), 'true')
    await sticky(page)
    await shot(page, 'author-compact-pinned')
  })
  await check('unpin collapses above threshold, mid-page upward scroll stays collapsed', async () => {
    await page.getByRole('button', { name: '取消固定页头', exact: true }).click()
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop += 180 })
    await settle(page)
    assert.equal(await page.getByRole('button', { name: '展开筛选栏', exact: true }).getAttribute('aria-expanded'), 'false')
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop -= 100 })
    await settle(page)
    assert.equal(await page.getByRole('button', { name: '展开筛选栏', exact: true }).getAttribute('aria-expanded'), 'false')
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop = 0 })
    await settle(page)
    await page.getByRole('button', { name: '收起筛选栏', exact: true }).waitFor()
  })
  await check('header snaps at measured T and expands below T, manual collapse clears pin', async () => {
    const report = page.locator('.list-report')
    const threshold = Number(await report.getAttribute('data-header-snap-threshold'))
    assert.ok(threshold > 0, 'expanded header content must have a measured threshold')
    await page.locator('.page-scroll').evaluate((el, y) => { el.scrollTop = y }, threshold - 1)
    await settle(page)
    assert.equal(await report.getAttribute('data-header-expanded'), 'true')
    await page.locator('.page-scroll').evaluate((el, y) => { el.scrollTop = y }, threshold)
    await settle(page)
    assert.equal(await report.getAttribute('data-header-expanded'), 'false')
    await page.locator('.page-scroll').evaluate((el, y) => { el.scrollTop = y }, threshold - 1)
    await settle(page)
    assert.equal(await report.getAttribute('data-header-expanded'), 'true')
    await page.getByRole('button', { name: '固定页头', exact: true }).click()
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop = 500 })
    await settle(page)
    await page.getByRole('button', { name: '收起筛选栏', exact: true }).click()
    await settle(page)
    assert.equal(await page.locator('.page-scroll').evaluate(el => el.scrollTop), threshold)
    assert.equal(await report.getAttribute('data-header-expanded'), 'false')
    assert.equal(await report.getAttribute('data-header-pinned'), 'false')
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop += 1 })
    await settle(page)
    assert.equal(await report.getAttribute('data-header-expanded'), 'false')
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop = 0 })
    await settle(page)
    assert.equal(await report.getAttribute('data-header-expanded'), 'true')
    const contentHeight = await page.locator('.list-page-header > div[hidden], .list-page-header > div:not([class])').evaluate(el => Math.ceil(el.getBoundingClientRect().height))
    await page.getByRole('button', { name: '收起筛选栏', exact: true }).click()
    await settle(page)
    assert.equal(await page.locator('.page-scroll').evaluate(el => el.scrollTop), contentHeight)
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop = 0 })
    await settle(page)
  })
  await check('live filters and selection without row navigation', async () => {
    await page.getByRole('textbox', { name: 'Search Purchase Orders', exact: true }).fill('PO-48865')
    await waitFor(async () => await table.locator('tbody [data-grid-row]').count() === 1, 'filter did not narrow rows')
    await page.getByRole('checkbox', { name: '选择全部订单', exact: true }).click()
    assert.equal(await table.locator('tbody [data-grid-row]').first().getAttribute('aria-selected'), 'true')
    assert.equal(new URL(page.url()).hash, '#/orders')
    await page.getByRole('textbox', { name: 'Search Purchase Orders', exact: true }).fill('')
  })
  await check('growing retains all-result select-all and F2 row/control navigation', async () => {
    const rows = table.locator('tbody [data-grid-row]')
    await rows.first().focus()
    await page.keyboard.press('ArrowDown')
    assert.equal(await rows.nth(1).evaluate(el => el === document.activeElement), true)
    await page.keyboard.press('Space')
    assert.equal(await rows.nth(1).getAttribute('aria-selected'), 'true')
    await page.keyboard.press('ControlOrMeta+a')
    assert.ok((await table.locator('[aria-selected="true"]').count()) >= 20)
    const status = await page.locator('.order-worklist [role="status"]').textContent()
    assert.match(status, /已选择 32 条/)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('F2')
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('role')), 'checkbox')
    await page.keyboard.press('F2')
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-grid-cell')), 'selection')
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop = el.scrollHeight })
    await waitFor(async () => await rows.count() === 32, 'growing did not load all rows')
  })
  await check('row Enter navigates and return preserves app list', async () => {
    await table.locator('tbody [data-grid-row]').nth(1).focus()
    await page.keyboard.press('Enter')
    await waitFor(() => page.url().includes('/orders/PO-48866'), 'row Enter navigation failed')
    await page.goto(`${lab}/#/orders`)
    await table.waitFor()
  })
  await check('Cozy density screenshot', async () => {
    await page.getByRole('button', { name: 'Cozy 密度', exact: true }).click()
    await page.locator('.page-scroll').evaluate(el => { el.scrollTop = 0 })
    await settle(page)
    await shot(page, 'author-cozy')
  })
  await check('900px and 390px pop-in, overflow menu and settings Escape', async () => {
    for (const viewport of [{ width: 900, height: 720 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport)
      await settle(page)
      const closeNavigation = page.getByRole('button', { name: '关闭导航', exact: true })
      if (await closeNavigation.isVisible()) await page.getByRole('button', { name: '收起导航', exact: true }).click()
      await fit(page, '.page-scroll')
      assert.ok(await table.locator('.popin-row').count() > 0)
      await shot(page, `author-${viewport.width}`)
    }
    const trigger = page.getByRole('button', { name: '更多表格操作', exact: true })
    if (await trigger.isVisible()) {
      await trigger.click()
      await page.getByRole('menuitem', { name: '打开表格设置', exact: true }).click()
    } else await page.getByRole('button', { name: '打开表格设置', exact: true }).click()
    const settings = page.getByRole('dialog', { name: '设置', exact: true })
    await settings.waitFor()
    await settle(page)
    const settingsBox = await settings.boundingBox()
    assert.deepEqual([settingsBox.x, settingsBox.y, settingsBox.width, settingsBox.height], [0, 0, 390, 844], 'phone settings must fill the viewport')
    await shot(page, 'author-phone-settings')
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    assert.equal(await page.getByRole('dialog').count(), 0)
    await shot(page, 'author-phone-overflow-closed')
  })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto(`${consumer}/#/inventory`)
  const inventory = page.getByRole('grid', { name: /物料库存/ })
  await inventory.waitFor()
  await check('independent consumer uses shared page and external rows', async () => {
    assert.equal(await inventory.locator('tbody [data-grid-row]').count(), 20)
    assert.equal(await page.locator('[data-fiori-root] .list-report').count(), 1)
    await fit(page, '[data-fiori-scroll]')
    await shot(page, 'inventory-compact')
  })
  await check('consumer row checkbox, business action and retained selection', async () => {
    const firstId = await inventory.locator('tbody [data-grid-row]').filter({ hasText: '未盘点' }).first().getAttribute('data-grid-row')
    const firstRow = inventory.locator(`[data-grid-row="${firstId}"]`)
    await firstRow.locator('[role="checkbox"]').click()
    assert.equal(await firstRow.getAttribute('aria-selected'), 'true')
    await page.getByRole('button', { name: '标记已盘点', exact: true }).click()
    assert.equal(await firstRow.getAttribute('aria-selected'), 'true')
    assert.match(await firstRow.textContent(), /已盘点/)
    await shot(page, 'inventory-selected')
  })
  await check('consumer different filter schema and empty result', async () => {
    const search = page.getByRole('textbox', { name: /搜索物料/ })
    await search.fill('no-such-inventory')
    await waitFor(async () => await inventory.locator('tbody [data-grid-row]').count() === 0, 'consumer empty filter failed')
    await shot(page, 'inventory-no-data')
    await search.fill('')
  })
  await check('consumer keyboard row navigation and detail return', async () => {
    const firstRow = inventory.locator('tbody [data-grid-row]').nth(3)
    const id = await firstRow.getAttribute('data-grid-row')
    await firstRow.focus()
    const before = await page.locator('[data-fiori-scroll]').evaluate(el => el.scrollTop)
    await page.keyboard.press('Enter')
    await waitFor(() => page.url().includes(`/inventory/${encodeURIComponent(id)}`), 'inventory row did not navigate')
    await page.getByRole('button', { name: '返回物料库存', exact: true }).click()
    await inventory.waitFor()
    await waitFor(async () => await firstRow.evaluate(el => el === document.activeElement), 'detail return did not restore the opened row focus')
    const after = await page.locator('[data-fiori-scroll]').evaluate(el => el.scrollTop)
    assert.ok(Math.abs(before - after) <= 1, 'detail return did not restore list scroll position')
  })
  await check('consumer phone pop-in and never-overflow business action', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await settle(page)
    await fit(page, '[data-fiori-scroll]')
    assert.ok(await inventory.locator('.popin-row').count() > 0)
    assert.equal(await page.getByRole('button', { name: '标记已盘点', exact: true }).isVisible(), true)
    await shot(page, 'inventory-phone')
    await page.setViewportSize({ width: 320, height: 844 })
    await settle(page)
    const trigger = page.getByRole('button', { name: /更多.*操作/ })
    await trigger.click()
    const menu = page.getByRole('menu')
    await menu.waitFor()
    assert.equal(await menu.evaluate(el => !!el.closest('[data-fiori-root]')), true)
    await shot(page, 'inventory-phone-overflow')
    await page.keyboard.press('Escape')
    await menu.waitFor({ state: 'hidden' })
    await waitFor(async () => await trigger.evaluate(el => el === document.activeElement), 'Escape did not restore overflow trigger focus')
  })
  await check('consumer phone filter draft cancel, submit and reset', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    const open = page.getByRole('button', { name: /调整筛选/ })
    await open.click()
    const dialog = page.getByRole('dialog', { name: '调整筛选', exact: true })
    await dialog.waitFor()
    await settle(page)
    const box = await dialog.boundingBox()
    assert.deepEqual([box.x, box.y, box.width, box.height], [0, 0, 390, 844], 'phone filters must fill the viewport without centering translation')
    await shot(page, 'inventory-phone-filter-dialog')
    await dialog.getByRole('textbox', { name: '搜索', exact: true }).fill('MAT-1001')
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.match(await page.locator('.responsive-table > [role="status"]').textContent(), /共 72 条/)
    await waitFor(async () => await open.evaluate(el => el === document.activeElement), 'filter cancel did not restore opener focus')
    await open.click()
    await dialog.getByRole('textbox', { name: '搜索', exact: true }).fill('MAT-1001')
    await dialog.getByRole('button', { name: '确定', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    await waitFor(async () => await inventory.locator('tbody [data-grid-row]').count() === 6, 'phone filter submit did not apply caller data')
    assert.equal(await inventory.locator('[aria-selected="true"]').count(), 0)
    await shot(page, 'inventory-phone-filtered')
    await open.click()
    await dialog.getByRole('button', { name: '重置', exact: true }).click()
    await dialog.getByRole('button', { name: '确定', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.match(await page.locator('.responsive-table > [role="status"]').textContent(), /共 72 条/)
  })
  assert.deepEqual(errors, [], 'browser runtime errors')
} catch (error) {
  if (!results.some(result => !result.passed)) results.push({ name: 'setup or final verification', passed: false, error: error.message })
  console.error(error.stack)
  process.exitCode = 1
} finally {
  await browser?.close()
  for (const server of servers) server.kill('SIGTERM')
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify({ baseline: 'SAPUI5 1.151.0 / Morning Horizon; browser snapshots are implementation regression evidence', platform: process.platform, browserVersion, playwrightVersion: JSON.parse(await fs.readFile(path.join(root, 'node_modules/playwright/package.json'), 'utf8')).version, screenshotMode: update ? 'update' : captureOnly ? 'capture-only' : 'compare', results, screenshots, browserErrors: errors }, null, 2) + '\n')
}
