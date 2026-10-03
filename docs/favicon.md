# Favicon integration — Vue / Vite

The provided RealFaviconGenerator files live once in Vite's `public/` directory:

- `favicon.svg` (includes native light/dark icon variants)
- `favicon-96x96.png`
- `favicon.ico`
- `apple-touch-icon.png`
- `web-app-manifest-192x192.png`
- `web-app-manifest-512x512.png`
- `site.webmanifest`

Vite serves them as static local resources and copies them unchanged into `dist/`. Do not import them from Vue components, copy them into `src/`, or add favicon tags to individual views.

The tags belong **once** in the root `index.html` `<head>`:

```html
<link rel="icon" type="image/png" href="%BASE_URL%favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="%BASE_URL%favicon.svg" />
<link rel="shortcut icon" href="%BASE_URL%favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="%BASE_URL%apple-touch-icon.png" />
<meta name="apple-mobile-web-app-title" content="Vaultsort" />
<link rel="manifest" href="%BASE_URL%site.webmanifest" />
```

`%BASE_URL%` is replaced by Vite. This project uses `base: './'`, so production links work at localhost root **and** under a static subdirectory. Manifest icon paths, `start_url`, and `scope` are relative to the manifest, not absolute site-root paths.

The CSP permits `img-src 'self' data:` and `manifest-src 'self'` while keeping `connect-src 'none'`. The manifest contains only local icon/application metadata: no service worker, telemetry, backend, storage, or vault data. Do not turn this into a persistence feature.

The `theme-color` meta tag matches the selected Slate canvas. `public/preferences.js` applies the saved theme (or native preference) before paint; `src/preferences.ts` updates it when switching. The supplied SVG favicon retains its native OS light/dark variants. The colored header logo is a separate Vite-imported source asset at `src/branding/vaultsort-logo.svg`.

Verify with `npm test` and `npm run build`. Check the generated `dist/index.html`, manifest-relative paths, and local asset responses before changing locations or deleting source assets.
