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
        .filter((f) => f.toLowerCase().endsWith(".png"))
        .map((filename) => {
          const { width, height } = readPngDimensions(path.join(dir, filename));
          return { url: `/artworks/${encodeURIComponent(filename)}`, width, height };
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
