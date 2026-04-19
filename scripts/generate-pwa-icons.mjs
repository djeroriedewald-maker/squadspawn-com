#!/usr/bin/env node
/**
 * Generate PWA/favicon PNGs from resources/icons/squadspawn.svg.
 * Runs on-demand (not in the build pipeline) — commit the output.
 *
 *   node scripts/generate-pwa-icons.mjs
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'resources', 'icons', 'squadspawn.svg');
const OUT = path.join(ROOT, 'public', 'icons');

const outputs = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-maskable-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
];

async function main() {
    await fs.mkdir(OUT, { recursive: true });
    const svg = await fs.readFile(SRC);

    for (const { name, size } of outputs) {
        const out = path.join(OUT, name);
        await sharp(svg, { density: 512 })
            .resize(size, size, { fit: 'cover' })
            .png({ compressionLevel: 9 })
            .toFile(out);
        console.log(`  ${name}  (${size}×${size})`);
    }

    // Copy the SVG as /favicon.svg for browsers that prefer vector
    await fs.copyFile(SRC, path.join(ROOT, 'public', 'favicon.svg'));
    console.log('  favicon.svg');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
