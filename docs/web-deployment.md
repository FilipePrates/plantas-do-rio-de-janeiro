# Web deployment

Public address: https://plantas.avesdobrasil.app

This app uses its own Cloudflare Worker, `plantas-do-rio`, to serve the
exported Expo website. Its only custom domain is `plantas.avesdobrasil.app`.
The bird app and the editor at `admin.avesdobrasil.app` have separate deployments.

## First deployment

Run these commands from this repository with Node in the package engine range:

```sh
npm ci
npx wrangler login
npx wrangler whoami
npm run check
npm run web:deploy
```

Select the Cloudflare account that owns the `avesdobrasil.app` zone.
Wrangler's browser login must be completed by the account owner. Credentials
stay in Wrangler's user configuration; do not put tokens in this repository.

`wrangler.jsonc` declares the custom domain. On deployment Cloudflare creates
the required DNS record and certificate. If that hostname already has a DNS
record or belongs to another service, inspect it before replacing it.

## Later updates

```sh
npm run check
npm run web:deploy
```

`web:build` exports only the web app into `dist/web`. The hosting configuration
serves that directory, so Android APKs elsewhere in `dist` are not published.
The export includes the plant catalog and its photographs. User display
preferences are stored in each browser; there is no server database or login.

To prepare the export without publishing:

```sh
npm run web:build
npx wrangler deploy --dry-run
```

After deployment, verify the guide, search, profiles, photos and bottom tabs
at the public address, including a mobile-width browser window.

References: [Expo web exports](https://docs.expo.dev/guides/publishing-websites/)
and [Cloudflare custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## November 11, 2026 update

Published version `234d3be8-bc23-422b-a100-08d621d45343` with 429 entries,
550 represented species and 721 photographs. The export was checked against
the canonical catalog and media hashes. Live mobile and desktop checks passed
for new profiles, captions, images, search loading, and gallery controls.
See [deployment record](web-deployment-2026-11-11.json) for hashes, the previous
version, and verification details.

The subsequent UI update, version `53979f5d-8157-4cd8-a907-3978481dceb8`,
removes the profile keyboard hint and increases desktop navigation chevron
strokes from 2.2 to 3.6. Catalog lists and the expanded photo viewer use the
same chevrons. All 54 tests, typecheck, catalog validation and export checks
passed. Live browser checks confirmed the exact exported bundle, removed
hint, responsive arrow weights, profile buttons and keyboard shortcuts, and
gallery and expanded-photo navigation, with no page errors.

The desktop navigation update, version `f37f24fe-4a64-40cd-bc7c-6c9bd5e8b53e`,
moves Guia, Famílias and Fitofisionomias into the header and removes the desktop
bottom bar. Guia returns directly to the guide; the grid/list toggle is beside
search. Desktop photo captions overlay the image between markers and credit.
Mobile navigation and caption placement remain unchanged. All 54 tests,
typecheck, catalog validation and export checks passed. Live checks at 1024,
1440 and 1920 pixels verified the exported bundle, top navigation, preserved
guide search, photo controls and credit access, caption spacing, and the mobile
layout at 390 pixels. Artifacts: `backups/web-deploy-2026-11-11/live/top-nav-*`.

The viewer update, version `2511f359-bf7c-40ac-8b98-b7ad255f6c2a`, uses a
transparent outlined desktop tab selection. The desktop viewer says
"Dois toques para ampliar", omits Restaurar, and centers its photo counter.
Clicks on the dark area beside the image move to the previous or next photo;
at the corresponding end of the list they close the viewer. These hit areas
follow the zoomed image edges. Mobile retains its hint, reset button and
navigation. All 54 tests, typecheck, catalog validation and export verification
passed. Live browser checks verified the exact bundle, all outlined tabs,
centered counter, navigation and closing at both ends, double-click zoom, and
mobile controls, without page errors. Artifacts:
`backups/web-deploy-2026-11-11/live/viewer-result.json` and screenshots.

The initial Pitcairnia branding update, version
`b2c399c1-85d0-499d-9545-1eaa7b98fd6d`, replaced the header and loading brand
with the generated red-flower mark and added the browser favicon. Native icon,
adaptive foreground, monochrome mask and splash configuration were prepared
for a later APK build. All 54 tests, typecheck, catalog and export verification
passed. Live browser checks confirmed the exported bundle and favicon hashes,
header branding at 1024/1440/1920 pixels, mobile branding, and profile/return
navigation, without page errors. Artwork and prompts are documented in
[branding-pitcairnia.md](branding-pitcairnia.md).
