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

## Creating fichas in batches

- Work efficiently: choose a useful batch size from the evidence available,
  rather than pursuing a fixed quota or stopping after a predetermined number.
  Reuse cached research and existing photos when appropriate. Keep research,
  verification and reports proportionate to the task and the user's budget.
- Compare `docs/Arvores_Arbustos_Nativos_RJ.xlsx` and existing genus groups
  with the catalog before selecting species. The workbook is a candidate index,
  not proof of municipal occurrence, and does not cover all life forms. Check
  for existing profiles, grouped members, accepted names and synonyms to avoid
  duplicates. Prefer relevant or well-documented species; useful licensed
  photos are a benefit, not a prerequisite. Defer unresolved taxa.
- Confirm accepted name, native status, Rio state occurrence and Atlantic
  Forest scope using Flora e Funga do Brasil and species-specific botanical
  sources. Record source URLs, access dates and page or specimen references when
  available, along with taxonomic conflicts and uncertainty. For Syagrus, use
  the Noblick (2017) revision in `docs/` as a primary morphological source.
  Assign `rio-city` only with specific municipal evidence; iNaturalist or a
  cultivated plant alone does not establish native municipal occurrence.
- Write original, readable Portuguese descriptions, identification guidance
  and ecology grounded in the sources. Explain how to distinguish similar
  species and where identification remains uncertain. Attribute dated
  conservation assessments; do not infer edibility or replace approved
  professional text with generic drafts.
- When photos are available, check each iNaturalist photo's license and source,
  archive acquisition evidence and hashes, and use the verified downloader or
  importer. Select images that show identifying features, with a caption and
  markers describing that individual image. Record identification uncertainty;
  a research-grade observation or a valid license does not replace human visual
  review. New text, photos and markers remain drafts until reviewed. Species
  without eligible pictures may still receive fichas; the photo-only filter
  hides them until disabled.
- Stage research and record additions, photo choices, unresolved issues and
  before/after counts. Preserve unrelated local changes. When splitting a genus,
  transfer the member's exact photos and evidence, retain IDs and redirects,
  remove duplicate membership and update the group's dated counts and text.
  Ensure no other species, records or photos are lost. If parallel agents are
  explicitly requested, give them separate research tasks and have one lead
  integrate changes to the canonical catalog.
- After integration run `npm run check`, and `npm run catalog:generate` when
  photo membership changes. Synchronize the local editor with
  `npm run editor:sync`; never seed or overwrite its active cloud catalog.
  On Windows, use the workspace `.tools/python` on `PATH` and set `PYTHONUTF8=1`
  if scripts invoke `python3`. The release check requires reviewed text and
  review of any photos present, but does not require a photo for every profile.
- Keep draft status honest: inspecting a photo or running automated checks is
  not human review. Explicit web deployment authorization permits publishing
  the requested drafts with their status intact; it does not mean they were
  reviewed or that a native app was updated. For an authorized deployment,
  follow the isolated export, browser, live bundle and documentation checks
  below. Never infer deployment authorization from a request to make fichas.

## Web UI and navigation

- The active identity is the Mandevilla flower. Source artwork and exports are
  in `assets/branding`; see `docs/branding-mandevilla.md` and
  `scripts/export_branding.mjs`. Keep branding artwork separate from catalog
  photographs. Native icon/splash changes require a later native build.
- Desktop places the green brand/tab/settings bar at the top, with guide
  search and photo-grid controls below it. The grid defaults to 12 columns
  and allows 4–22; preserve the separate three-column mobile guide.
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
