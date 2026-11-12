import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Export platform sizes from the generated artwork without changing its design.
const directory = resolve(import.meta.dirname, '../assets/branding');
const master = resolve(directory, 'mandevilla-logo-master.png');
const metadata = await sharp(master).metadata();
if (!metadata.hasAlpha) throw new Error('The source logo must retain transparency');
await mkdir(directory, { recursive: true });
for (const [name, size] of [['mandevilla-logo.png', 256], ['mandevilla-favicon.png', 96]]) {
  await sharp(master).resize(size, size, { fit: 'contain' }).png().toFile(resolve(directory, name));
}
const mark = await sharp(master).resize(860, 860).toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#FFFDF7' } })
  .composite([{ input: mark, gravity: 'centre' }]).removeAlpha().png().toFile(resolve(directory, 'mandevilla-app-icon.png'));
const adaptive = await sharp(master).resize(650, 650).extend({ top: 187, bottom: 187, left: 187, right: 187, background: '#00000000' }).png().toBuffer();
await sharp(adaptive).toFile(resolve(directory, 'mandevilla-foreground.png'));
const alpha = await sharp(adaptive).extractChannel('alpha').raw().toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#FFFFFF' } })
  .joinChannel(alpha, { raw: { width: 1024, height: 1024, channels: 1 } }).png().toFile(resolve(directory, 'mandevilla-monochrome.png'));
console.log('Exported Mandevilla logo, favicon, app icon, adaptive foreground and monochrome mask.');
