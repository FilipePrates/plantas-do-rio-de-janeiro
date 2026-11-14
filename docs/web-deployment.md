# Web deployment

## November 13, 2026 navigation regression correction

Published version `c30b66e7-5355-4be3-82a1-8047fb935557` from
`dist/web-top-grid-20261113`. Desktop navigation is at the top, followed by
guide search and grid controls. The grid defaults to 12 columns and permits
3–22. Existing valid saved choices remain intact; mobile keeps three columns.
Catalog content and media are unchanged.

Fetched and compared both repository branches: `master` and
`feat/botanical-curation` both retained the outdated bottom-toolbar layout.
The correction also updates the obsolete layout instruction in `AGENTS.md`.
TypeScript, all 63 tests, catalog validation and exported media hashes passed.
Local and live browser checks at 1024, 1440, 1920 and 390 pixels verified
navigation/search positions, a fresh desktop default of 12, minimum 3 with
reload persistence, mobile layout, search, profile photos and return navigation.
No page errors occurred. The public HTML-referenced bundle matches the export,
SHA-256 `5b73e22320135b49840d573cadcbec17b008219803b24a02f33df6b43a8a0dc0`.
Reports and screenshots are retained in `backups/top-grid-20261113/`.

## November 13, 2026 desktop grid minimum

Superseded: this deployment retained an outdated bottom navigation/search
layout and default of 10. Its browser checks did not assert toolbar positions
or the requested default. See the corrective deployment above.

Published version `77740637-3e9b-4ceb-8208-dbcda738a42e` from the isolated
`dist/web-grid-min-three-20261113` export. The desktop photo-grid slider now
allows 3–22 photos per row, and saved preferences accept the new minimum.
The default remains 10; mobile retains three columns.

TypeScript, all 63 tests, catalog validation and exported catalog/media hashes
passed. Local and live browser checks at 1024, 1440 and 390 pixels verified
three-column layout, desktop preference persistence after reload, search,
profile photos and return navigation without page errors. The live bundle
matches the verified export, SHA-256
`ce9a46b46a39cfe069ac41e641495e1349e39d57e18343ecb9b7371ff09e7dae`.
Verification records are retained in `backups/grid-min-three-20261113/`.
This web deployment does not update installed native apps.

## November 12, 2026 search focus ring correction

Published version `9586b351-f5d7-499d-bd80-01fcf461047d` from
`dist/web-focus-ring-fix`. Chrome still drew its automatic focus ring with
the previous zero-width setting; explicitly setting the outline style fixes it.
Project and export checks passed. A focused mobile screenshot confirmed the
ring was gone, and live mobile and desktop search checks passed. The bundle
SHA-256 is `9ed55e45faf385362e6a00d5c1dc57daaa3446c096faadec5304ec2466f6c785`.

## November 12, 2026 mobile search focus

Published version `b80d8b60-1018-4339-b9f5-1425cbb151db` from
`dist/web-mobile-focus`. The guide search focus outline is removed on mobile
web as well as desktop. Project checks and catalog/media export verification
passed. Local and live browser checks at 390 and 1440 pixels confirmed the
focus style, search results and guide layout without page errors. The exported
bundle SHA-256 is `934249c41f59997821c8b039c69783b8af8b8548512a2a7521105edeaa178149`.

## November 12, 2026 workbook batch deployment

Published version `22b35f7f-5644-4407-b219-4675c0141457` from
`dist/web-workbook-20261112`. Six new draft profiles and six CC0 images bring
the guide to 438 entries, 559 represented species and 727 photographs. The
63 tests, TypeScript, catalog validation and all media hashes passed. Local and
live browser checks at 390 and 1440 pixels verified all six profiles, their
images and the HTML-referenced bundle SHA-256
`9a66c9e3459f2dc1fc7ab7317b3f1bf4674e58eb3a7a21e01f565c9a3463a2ea`.
Text, image identification and markers remain draft pending human review.
This deployment does not update installed Android apps.

## November 12, 2026 Syagrus batch deployment

Published version `0a27a9db-de66-4a90-bbb7-900c91cf5a42` from the isolated
`dist/web-prod-20261112-current` export. The guide contains 432 entries, 553
represented species and 721 photos. Three additional Syagrus profiles remain
drafts and have no photos; the photo-only preference hides them until disabled.
TypeScript, 63 tests, catalog validation, all catalog/media export hashes and
mobile/desktop browser checks passed. Live checks confirmed the five palm
profiles and the HTML-referenced bundle SHA-256
`3c4c72c9178878fd7c94003d26944e1a9ebddc42b7f79994b3aa024a6da5455d`.
This deployment does not update an installed Android application.

## November 12, 2026 desktop advanced list

Published version `67fdc799-b4f6-404a-bad2-57b77b488018` with a desktop
family-grouped advanced list using two or three columns and wrapping all
alternate names. Mobile keeps its single-column list. TypeScript, 63 tests,
catalog validation, all media hashes and export verification passed. Local
and live browser checks covered list layout and profile navigation at 390,
1024 and 1600 pixels, with no page errors or failed assets. The live bundle
matched the verified export, SHA-256
`25cca97870a3d65bec772a36cfd33924e69c02a7aad314304180f4fe1316d067`.

## November 12, 2026 current guide deployment

Published version `737d0cb8-3c27-4d37-8888-cd0b5e3c5a4e` with the current
desktop habitat cards, habitat filtering, name styling and two Syagrus draft
profiles. The catalog remains 429 entries, 550 represented species and 721
photos. The isolated build passed TypeScript, 63 tests, catalog validation,
catalog text and all original-photo and thumbnail hash checks. Local and live
mobile and desktop checks covered both palm profiles and their images without
page errors or failed assets. On November 12 the observed live bundle was
`index-d932b12565290d491d5d38bb98c6e07a.js`, SHA-256
`25cca97870a3d65bec772a36cfd33924e69c02a7aad314304180f4fe1316d067`,
matching `verification-list.json`. The previously recorded hash referred to
`verification-current.json`, a different export. Both reports record the same
catalog hash and counts.
The export and verification are retained in `backups/syagrus-deploy-2026-11-12/`.
Text and photo review remains pending; no installed native app was updated.

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

## November 12, 2026 names and catalog toolbar update

Published version `eda6a497-3c73-4339-aaf5-38432cdadab5`. Scientific names use
regular-weight italics. The catalog stores an empty primary common name for
220 entries that previously repeated their scientific name, and profiles show
that scientific name once as their fallback heading. The desktop catalog title,
result count, search and section tabs share a compact toolbar. Mobile keeps its
existing catalog layout.

The isolated source passed TypeScript, all 61 tests and catalog validation.
The export verified every original photo and thumbnail hash. Local and live
browser checks at 1024, 1440, 1920 and 390 pixels verified the exact
HTML-referenced bundle, search and family return navigation, profile reloads,
photos and name styling, without page errors or failed assets. The separate
navigation edit in progress was excluded from this deployment. The plant editor
and its cloud database were not deployed or changed.

See the [deployment record](web-deployment-2026-11-12-toolbar.json). The tested
export, logs and screenshots are retained under
`backups/web-deploy-2026-11-12-toolbar/`.

## November 12, 2026 completed navigation update

Published version `3473c635-1795-403a-81b5-c62d986f5bb3` with the pending
profile scroll-restoration changes and the latest compact desktop toolbars.
Scroll restoration now cancels stale animation callbacks so an earlier profile
cannot reset the next profile's position. Zero-position profiles do not schedule
a delayed reset. Existing scientific-name and optional common-name behavior is
preserved.

TypeScript, all 61 tests and catalog validation passed. The exact exported
bundle passed local and live checks at 1024, 1440, 1920 and 390 pixels for
Back/Forward, reloads, saved profile positions, conservation-unit links, search,
family navigation, name styling and photos. No page errors or failed assets were
observed. The catalog remains at 429 entries, 550 represented species and 721
photos, with catalog hash
`1a924bedaf1fe4df875d92810fe9fa0f74442c0231885f6e2e9f9cbab76777be`.
The deployed bundle is `index-cdd726b06f35e1728eba33ddbae96a98.js`, SHA-256
`3a350e10fa35d56ddfc87c345552936dd635131be0f1d179c30128630e6a19d4`.
Artifacts: `backups/web-deploy-2026-11-12-finish/`; the tested export is
`dist/web-finish-20261112-nav/`.

The separate plant editor was published as
`d4696c0c-ff17-4c82-9827-2ac422893fdb`. Its 14 tests and isolated local save/export
checks passed. Live checks verified login, exact asset hashes and authenticated
API/media protection without editing shared records. The tested database
migration cleared 220 repeated common names, preserving unrelated records,
drafts, editorial states and all old history while recording new revisions.
Private backups and editor checks are retained in that repository's
`.local/deploy-finish-20261112/`.
