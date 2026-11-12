# Plantas do Rio de Janeiro

- This is an independent Expo / React Native / TypeScript app. The bird app and
  its production editor are separate products. Never copy their `.env`, secrets,
  signing keys, generated native folders, paid packs, cloud IDs, or Git remotes.
- Start feature branches from this repository's `master`; both platform releases
  must eventually use the same reviewed source commit.
- Do not run build, prebuild, install-to-device, signing, release, or Gradle
  commands unless the user explicitly asks to run them. Typechecks, content
  validation, tests, and local development servers are allowed.
- Preserve custom state navigation, the earthy palette and square photos.
  Mobile uses a three-column guide and family-grouped advanced list. Desktop
  supports adjustable guide columns and card-based family/species/unit indexes.
  No audio or maps.
- The canonical catalog is `src/data/plants.json`. Species and grouped genera
  share one schema in `src/catalog.mjs` / `src/catalog.d.mts`.
- At most 1,500 represented species, including every listed member of a grouped
  genus; no duplicate membership across entries. The initial seed has five
  invasives; classification is editable with no fixed invasive-count limit.
- Scope: native Atlantic Forest flora of Rio city; documented Rio state records
  may be included but must retain `rio-state` until municipal evidence exists.
- Photos must be iNaturalist photo-level CC0 or CC BY 4.0 (CC BY authorized
  on 2026-10-28). Never substitute CC BY-NC, CC BY-SA, CC BY-ND, or
  `default_photo`. Preserve downloaded license evidence and hashes. CC BY
  requires the supplied attribution, source and license links, and disclosure
  of thumbnail resizing/cropping; do not label CC BY photos as CC0.
- Flower/fruit/leaf/bark/whole-plant markers describe individual photos, not every
  photo in a phenologically annotated observation. Human visual review required.
- Draft-generated text and images must remain draft until reviewed. Counts in
  grouped descriptions are state-level, source-dated, and derived from members.
- Photos are optional: include important, relevant or well-documented species
  even when no eligible photograph is available. Do not invent images or delay
  a supported profile solely for lack of photos. The photo-only guide filter
  hides these profiles until disabled.
- Run `npx tsc --noEmit`, `npm test`, and `npm run catalog:check` after meaningful
  changes. Run `npm run catalog:generate` after changes to photo membership.
- The sibling plant editor works locally; synchronize with `npm run editor:sync`.
  Never point it at the production bird Supabase project or R2 buckets.

## Web UI and navigation

- The active identity is the Mandevilla flower. Source artwork and exports are
  in `assets/branding`; see `docs/branding-mandevilla.md` and
  `scripts/export_branding.mjs`. Keep branding artwork separate from catalog
  photographs. Native icon/splash changes require a later native build.
- Desktop currently places the green brand/tab/settings bar at the bottom.
  Profile names remain in a fixed row with previous/next controls, including
  single-result selections. Keep descriptions near the top and text readable;
  size galleries to the viewport so controls remain reachable.
- Mobile and desktop changes must be checked independently. Do not apply a
  desktop-only layout request to native/mobile screens by accident.
- Shared URLs must restore the selected profile or filtered list in a fresh
  browser, without depending on the sender's storage. Preserve recipient lists.
  Check reload, browser Back/Forward, catalog context and profile scroll return.
- Conservation-unit names in profiles should link to that unit's filtered
  guide, retaining their text appearance. Support normal clicks, copied links
  and opening a new tab. Retain species-specific evidence for grouped genera.
- Desktop viewer background clicks cycle galleries in both directions. With
  only one photo they close the viewer. Keep image zoom and explicit close.

## Verification and publishing

- Public guide: https://plantas.avesdobrasil.app. Deployment instructions live
  in `docs/web-deployment.md`; the plant editor has its own deployment.
- Use `npm run check` for application changes. Browser checks should cover
  affected desktop widths and mobile, navigation, search and relevant media.
- Test using isolated browser contexts. Never clear a user's browser storage
  or modify real editor records merely to verify a layout.
- Preserve concurrent source changes and exports. Use a dedicated export
  directory if needed; `scripts/verify_web_export.mjs` accepts an export directory
  and report path. Check HTML-referenced bundles and catalog/media hashes.
- Publish only within the user's authorized scope. Verify the live page after
  deployment and record the version and checks. Do not equate a successful
  export with a live deployment or an updated installed APK.
