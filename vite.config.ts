import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readPngDimensions(filePath: string): { width: number; height: number } {
  const buffer = Buffer.alloc(24);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buffer, 0, 24, 0);
  fs.closeSync(fd);
  // PNG header: 8-byte signature + 4-byte IHDR length + 4-byte "IHDR" type + 4-byte width + 4-byte height
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readJpegDimensions(filePath: string): { width: number; height: number } {
  const buffer = fs.readFileSync(filePath);
  let offset = 2; // skip SOI marker
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    // Markers with no payload (standalone or restart markers)
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    const isSofMarker =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSofMarker) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error(`Could not read JPEG dimensions: ${filePath}`);
}

function readImageDimensions(filePath: string): { width: number; height: number } {
  return filePath.toLowerCase().endsWith(".png") ? readPngDimensions(filePath) : readJpegDimensions(filePath);
}

function artworkAutoDiscovery(): Plugin {
  const virtualModuleId = "virtual:artworks";
  const resolvedId = "\0virtual:artworks";

  return {
    name: "artwork-auto-discovery",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedId;
    },
    load(id) {
      if (id !== resolvedId) return;
      const dir = path.resolve(__dirname, "public/artworks");
      const artworks = fs
        .readdirSync(dir)
        .filter((f) => /\.(png|jpe?g)$/i.test(f))
        .map((filename) => {
          const { width, height } = readImageDimensions(path.join(dir, filename));
          return { url: `artworks/${encodeURIComponent(filename)}`, width, height };
        });
      return `export default ${JSON.stringify(artworks)};`;
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    artworkAutoDiscovery(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "."),
    },
  },
});
