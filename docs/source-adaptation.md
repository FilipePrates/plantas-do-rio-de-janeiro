# Product separation

The initial source inspection used the clean bird app `master` at
`bf103455fa94e92335c62ad7837a0127bb127a40` and the bird content editor at
`62856dbe29b077cac9b9998c6fe11c8e2fff6574`.

The plant app reuses the earthy palette and selected navigation SVGs, Expo
dependency versions, and the guide's interaction structure. Plant-specific
types, profiles, filtering, local persistence, validation, import scripts and
catalog are separate. The app has its own entry module and proposed native
identifiers. It has no Git remote pointing to the bird repository.

The editor follows the existing editor's record/form/photo/export workflow,
using a separate Vite project and IndexedDB draft storage. Its shared schema
is copied deliberately by the plant app's `editor:sync` command. Production
cloud adapters are not included in this initial local version.

No whole-folder copy was made: bird media, audio, paid packs, native build
outputs, production cloud resources, branding artwork, credentials, signing
files, and repository histories are not part of the new product.
