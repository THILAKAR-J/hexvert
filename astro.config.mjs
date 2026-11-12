import { defineConfig } from 'astro/config';

// Static site. Every page is plain HTML; the converter script is the only JavaScript.
export default defineConfig({
  site: 'https://hexvert.com',
  trailingSlash: 'never',
  build: {
    // emit /hex-to-rgb.html so Cloudflare Pages serves it at /hex-to-rgb (no trailing slash)
    format: 'file',
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
});
