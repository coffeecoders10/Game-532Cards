// Renders public/logo.svg into the PNG/ICO assets used for branding and favicons.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile("public/logo.svg");
const png = (size) => sharp(svg, { density: (72 * size) / 512 * 2 }).resize(size, size).png().toBuffer();

await writeFile("public/cardgames_logo.png", await png(512));
await writeFile("app/apple-icon.png", await png(180));
await writeFile("app/icon.svg", svg);

// favicon.ico with embedded PNG frames
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(png));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
frames.forEach((buf, i) => {
  const o = 6 + i * 16;
  head[o] = sizes[i];
  head[o + 1] = sizes[i];
  head.writeUInt16LE(1, o + 4);
  head.writeUInt16LE(32, o + 6);
  head.writeUInt32LE(buf.length, o + 8);
  head.writeUInt32LE(offset, o + 12);
  offset += buf.length;
});
await writeFile("app/favicon.ico", Buffer.concat([head, ...frames]));
