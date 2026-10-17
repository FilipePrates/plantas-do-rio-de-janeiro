# Plantas do Rio de Janeiro

- This is an independent Expo / React Native / TypeScript app. The bird app and
  its production editor are separate products. Never copy their `.env`, secrets,
  signing keys, generated native folders, paid packs, cloud IDs, or Git remotes.
- Start feature branches from this repository's `master`; both platform releases
  must eventually use the same reviewed source commit.
- Do not run build, prebuild, install-to-device, signing, release, or Gradle
  commands unless the user explicitly asks to run them. Typechecks, content
  validation, tests, and local development servers are allowed.
- Preserve custom state navigation, the earthy palette, square photos, a fixed
  three-column grid, and family-grouped advanced list. No audio or maps.
- The canonical catalog is `src/data/plants.json`. Species and grouped genera
  share one schema in `src/catalog.mjs` / `src/catalog.d.mts`.
- At most 1,500 represented species, including every listed member of a grouped
  genus; no duplicate membership across entries. The initial seed has five
  invasives; classification is editable with no fixed invasive-count limit.
- Scope: native Atlantic Forest flora of Rio city; documented Rio state records
  may be included but must retain `rio-state` until municipal evidence exists.
- Photos must be iNaturalist photo-level CC0 only. Never substitute CC BY,
  CC BY-NC, or `default_photo`. Preserve downloaded license evidence and hashes.
- Flower/fruit/leaf/bark/whole-plant markers describe individual photos, not every
  photo in a phenologically annotated observation. Human visual review required.
- Draft-generated text and images must remain draft until reviewed. Counts in
  grouped descriptions are state-level, source-dated, and derived from members.
- Run `npx tsc --noEmit`, `npm test`, and `npm run catalog:check` after meaningful
  changes. Run `npm run catalog:generate` after changes to photo membership.
- The sibling plant editor works locally; synchronize with `npm run editor:sync`.
  Never point it at the production bird Supabase project or R2 buckets.
