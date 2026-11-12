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

The Mandevilla identity update, version `6ad38011-2601-45c9-90ef-f45be7c54294`,
replaces the red Pitcairnia branding with the user's white-flowered
Mandevilla crassinoda concept. Header, loading screen and favicon use the
new mark; native app icon, adaptive/monochrome assets and splash configuration
are ready for a future APK build. All 54 tests, typecheck, catalog validation
and export verification passed. Live checks confirmed matching JavaScript
and favicon hashes, header rendering at 1024/1440/1920 pixels and on mobile,
and profile/return navigation without page errors. The catalog remains at
429 entries, 550 represented species and 721 photos, with unchanged catalog
hash `39e1e7a5b3eda77924df53a3dc6f7c1afffb59823ba66828f4cf9ae3b09ff117`.
Artwork and the built-in imagegen prompt are in
[branding-mandevilla.md](branding-mandevilla.md). Live artifacts:
`backups/web-deploy-2026-11-11/live/mandevilla-result.json` and screenshots.

The profile-name update, version `0772748f-c23a-48fa-b795-b7ab55bb05e1`,
moves both plant names into the fixed desktop row between Anterior and Próxima.
The preferred primary name and scientific-name italics are preserved. Family,
geography, origin and review status remain in the scrolling information column,
starting higher after the names are removed. The row is also present for
single-result profiles with disabled navigation. Mobile retains names in its
profile body. All 54 tests, typecheck, catalog validation and export verification
passed. Live checks verified both name preferences, desktop widths
1024/1440/1920, fixed names while scrolling, updated names on profile navigation,
mobile preservation, and exact exported bundle hashes without page errors.
Artifacts: `backups/web-deploy-2026-11-11/live/sticky-names-*`.

The desktop catalog update, version `e7320b61-4761-4479-82fc-300a0c45e319`,
uses responsive family cards with licensed catalog previews, a family-grouped
species card index and conservation-unit cards with recorded-species counts.
Search, family back navigation, filtered guide selections and mounted index
scroll state are retained. Single-result species selections still show the
fixed name row with disabled previous/next controls. Mobile retains the existing
lists. All 54 tests, TypeScript, catalog and export checks passed. Live browser
checks at 1024/1440/1920 pixels covered the grids, search/empty states, family
sequences, unit scopes, single-result fixed titles, exact bundle hashes and
mobile preservation without page errors. Artifacts:
`backups/web-deploy-2026-11-11/live/desktop-catalog-result.json` and screenshots.

The desktop bottom-navigation trial, version
`feefb018-4857-4d74-b012-ccb530d1f3ba`, moves the full green brand/navigation/
settings bar below the content. It occupies layout space so content is not
covered. Desktop search and profiles start at the top, with the fixed profile
name/previous/next row remaining above its scrollable content. The existing
mobile top header and bottom tabs are preserved. All 54 tests, TypeScript,
catalog and export checks passed. Live checks at 1024/1440/1920 confirmed bar
placement, all tabs and settings, preserved guide search, profile-name position
while scrolling, footer clearance, mobile layout and matching bundle hashes,
without page errors. Artifacts:
`backups/web-deploy-2026-11-11/live/bottom-nav-result.json` and screenshots.

The viewer cycling update, version `18c644a5-f826-432c-ac3d-d3468a79e5bc`,
changes desktop background side clicks to wrap around galleries with multiple
photos: right from last to first, left from first to last. A single-photo
gallery still closes on either background side. Image zoom, explicit close,
arrow-button limits and mobile controls are preserved. All 54 tests,
TypeScript, catalog and export checks passed. Live browser checks covered
two- and three-photo cycling in both directions, single-photo closing from
both sides, double-click zoom, mobile controls and exact exported bundle hashes
without page errors. Artifact:
`backups/web-deploy-2026-11-11/live/viewer-cycle-result.json`.
