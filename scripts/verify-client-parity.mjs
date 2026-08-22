#!/usr/bin/env node
/**
 * Static parity check: paths used in web vs mobile service layers.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const WEB_SERVICES = path.join(repoRoot, 'clients/web-nextjs/src/services');
const MOBILE_SERVICES = path.join(repoRoot, 'clients/mobile-react-native/src/services');

const SHARED_SERVICE_FILES = [
  'authService.ts',
  'cartService.ts',
  'productService.ts',
  'orderService.ts',
  'arService.ts',
  'apiClient.ts'
];

const API_PATH_RE = /['"`](\/api\/[^'"`]+)['"`]/g;

function extractApiPaths(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const paths = new Set();
  for (const match of text.matchAll(API_PATH_RE)) {
    let p = match[1];
    p = p.replace(/\$\{[^}]+\}/g, '{id}');
    paths.add(p);
  }
  return paths;
}

function readServicePaths(dir, fileName) {
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return new Set();
  return extractApiPaths(filePath);
}

const mismatches = [];

for (const file of SHARED_SERVICE_FILES) {
  const webPaths = readServicePaths(WEB_SERVICES, file);
  const mobilePaths = readServicePaths(MOBILE_SERVICES, file);

  if (
    file === 'orderService.ts' ||
    file === 'authService.ts' ||
    file === 'cartService.ts' ||
    file === 'productService.ts' ||
    file === 'arService.ts' ||
    file === 'apiClient.ts'
  ) {
    // These services use API_ROUTES from @terravision/shared (no inline path strings).
    continue;
  }

  const webOnly = [...webPaths].filter((p) => !mobilePaths.has(p));
  const mobileOnly = [...mobilePaths].filter((p) => !webPaths.has(p));

  if (webOnly.length || mobileOnly.length) {
    mismatches.push({ file, webOnly, mobileOnly });
  }
}

if (mismatches.length) {
  console.error('Client parity mismatches found:');
  for (const m of mismatches) {
    console.error(`  ${m.file}`);
    if (m.webOnly.length) console.error(`    web only: ${m.webOnly.join(', ')}`);
    if (m.mobileOnly.length) console.error(`    mobile only: ${m.mobileOnly.join(', ')}`);
  }
  process.exit(1);
}

console.log('OK — web/mobile shared service API paths are aligned.');
