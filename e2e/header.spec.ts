import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const evidenceDir = join(tmpdir(), 'foundation-build-header-2026-10-31');

test('Foundation symbol is linked, centered, and clear of local controls', async ({ page }) => {
  await page.goto('/docs/request-for-microproducts');
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await mkdir(evidenceDir, { recursive: true });

  const nav = page.getByRole('navigation', { name: 'Build Trilemma navigation', exact: true });
  const symbol = nav.getByRole('link', { name: 'Visit Trilemma Foundation', exact: true });
  await expect(symbol).toHaveAttribute('href', 'https://www.trilemma.foundation/');
  await expect(symbol).not.toHaveAttribute('target', '_blank');
  await expect(symbol.locator('img')).toHaveAttribute('alt', '');

  const asset = await page.request.get('/foundation/symbol.svg');
  expect(asset.status()).toBe(200);
  expect(asset.headers()['content-type']).toContain('image/svg+xml');
  expect(await asset.text()).toContain('<svg');

  for (const width of [320, 390, 768, 1024, 1536]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(symbol).toBeVisible();
    const metrics = await page.evaluate(() => {
      const logo = document.querySelector<HTMLElement>('.foundation-local-symbol')!;
      const names = ['.foundation-local-brand', '.playbook-page-toggle', '.playbook-search', '.playbook-links'];
      const rect = (node: Element) => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        logo: rect(logo),
        controls: names.map(name => document.querySelector<HTMLElement>(name)).filter((node): node is HTMLElement => Boolean(node?.getClientRects().length)).map(rect),
        image: rect(logo.querySelector('img')!),
      };
    });
    expect(Math.abs(metrics.logo.x + metrics.logo.width / 2 - width / 2)).toBeLessThanOrEqual(1);
    expect(metrics.logo.width).toBeGreaterThanOrEqual(44);
    expect(metrics.logo.height).toBeGreaterThanOrEqual(44);
    expect(metrics.image.width).toBe(width >= 640 ? 40 : 36);
    await expect.poll(() => page.evaluate(() => Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--foundation-shell-height')) - document.querySelector<HTMLElement>('.playbook-header')!.getBoundingClientRect().height))).toBeLessThanOrEqual(1);
    for (const control of metrics.controls) {
      const overlaps = metrics.logo.x < control.x + control.width && metrics.logo.x + metrics.logo.width > control.x
        && metrics.logo.y < control.y + control.height && metrics.logo.y + metrics.logo.height > control.y;
      expect(overlaps, `symbol overlaps header control at ${width}px`).toBe(false);
    }
    await page.screenshot({ path: join(evidenceDir, `header-${width}-1x.png`) });
  }

  const baseSizes = await page.locator('.playbook-header :is(a,button,input)').evaluateAll(nodes =>
    nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
  await page.locator('.playbook-header :is(a,button,input)').evaluateAll(nodes => {
    for (const node of nodes) {
      const size = parseFloat(getComputedStyle(node).fontSize);
      (node as HTMLElement).style.setProperty('font-size', `${size * 2}px`, 'important');
    }
  });
  const doubleSizes = await page.locator('.playbook-header :is(a,button,input)').evaluateAll(nodes =>
    nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
  expect(doubleSizes).toHaveLength(baseSizes.length);
  doubleSizes.forEach((size, index) => expect(size).toBe(baseSizes[index] * 2));

  for (const width of [320, 390, 768, 1024, 1536]) {
    await page.setViewportSize({ width, height: 844 });
    const metrics = await page.evaluate(() => {
      const logo = document.querySelector<HTMLElement>('.foundation-local-symbol')!;
      const names = ['.foundation-local-brand', '.playbook-page-toggle', '.playbook-search', '.playbook-links'];
      const rect = (node: Element) => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        logo: rect(logo),
        controls: names.map(name => document.querySelector<HTMLElement>(name)).filter((node): node is HTMLElement => Boolean(node?.getClientRects().length)).map(rect),
      };
    });
    expect(Math.abs(metrics.logo.x + metrics.logo.width / 2 - width / 2)).toBeLessThanOrEqual(1);
    await expect.poll(() => page.evaluate(() => Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--foundation-shell-height')) - document.querySelector<HTMLElement>('.playbook-header')!.getBoundingClientRect().height))).toBeLessThanOrEqual(1);
    for (const control of metrics.controls) {
      const overlaps = metrics.logo.x < control.x + control.width && metrics.logo.x + metrics.logo.width > control.x
        && metrics.logo.y < control.y + control.height && metrics.logo.y + metrics.logo.height > control.y;
      expect(overlaps, `2x-text symbol overlaps header control at ${width}px`).toBe(false);
    }
    await page.screenshot({ path: join(evidenceDir, `header-${width}-2x-text.png`) });
  }
});

test('each local site route keeps one header and the symbol link is tabbable', async ({ page }) => {
  for (const path of ['/', '/agents', '/docs/request-for-microproducts']) {
    await page.goto(path);
    await expect(page.locator('.playbook-header')).toHaveCount(1);
    await expect(page.locator('.foundation-header, .foundation-header-bar')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Visit Trilemma Foundation', exact: true })).toHaveCount(1);
  }

  await page.setViewportSize({ width: 1280, height: 844 });
  await page.goto('/agents');
  const symbol = page.getByRole('link', { name: 'Visit Trilemma Foundation', exact: true });
  expect(await symbol.evaluate(node => (node as HTMLAnchorElement).tabIndex)).toBe(0);
});
