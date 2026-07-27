const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function generatePNG(width, height, isMaskable = false) {
  const widthBuf = Buffer.alloc(4);
  widthBuf.writeUInt32BE(width, 0);

  const heightBuf = Buffer.alloc(4);
  heightBuf.writeUInt32BE(height, 0);

  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let pos = 0;

  const bgR = 0x0f, bgG = 0x0c, bgB = 0x1b, bgA = 0xff; // #0f0c1b
  const purpleR = 0x8b, purpleG = 0x5c, purpleB = 0xf6, purpleA = 0xff; // #8b5cf6
  const innerR = 0xec, innerG = 0x48, innerB = 0x99, innerA = 0xff; // #ec4899

  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = width * (isMaskable ? 0.35 : 0.4);
  const innerRadius = width * (isMaskable ? 0.22 : 0.25);

  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = bgR, g = bgG, b = bgB, a = bgA;

      if (dist <= outerRadius && dist >= innerRadius) {
        r = purpleR; g = purpleG; b = purpleB; a = purpleA;
      } else if (dist < innerRadius) {
        r = innerR; g = innerG; b = innerB; a = innerA;
      }

      rawData[pos++] = r;
      rawData[pos++] = g;
      rawData[pos++] = b;
      rawData[pos++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let k = n;
      for (let m = 0; m < 8; m++) {
        k = (k & 1) ? (0xedb88320 ^ (k >>> 1)) : (k >>> 1);
      }
      table[n] = k;
    }
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.concat([
    widthBuf,
    heightBuf,
    Buffer.from([8, 6, 0, 0, 0])
  ]);
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180));

console.log('✅ Ícones PWA PNG gerados com sucesso em /public!');
