// Regenerates the PNG app icons from public/icons/icon.svg.
// Requires librsvg: `brew install librsvg` (macOS) or `apt install librsvg2-bin`.
import { $ } from 'bun';

const sizes: [string, number][] = [
  ['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180], ['favicon-64.png', 64],
];
for (const [name, px] of sizes) {
  await $`rsvg-convert -w ${px} -h ${px} public/icons/icon.svg -o public/icons/${name}`;
  console.log(`wrote public/icons/${name}`);
}
