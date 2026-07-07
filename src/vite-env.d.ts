/// <reference types="vite/client" />

declare module "virtual:artworks" {
  const artworks: Array<{ url: string; width: number; height: number }>;
  export default artworks;
}
