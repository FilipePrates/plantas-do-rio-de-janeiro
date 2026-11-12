# Pitcairnia identity

Archived concept. The active branding has moved to Mandevilla at the user's
request; see [branding-mandevilla.md](branding-mandevilla.md). Only the initial
Pitcairnia concept was deployed. The joined flower-only revision was not
published. The current export script produces Mandevilla assets.

The mark was generated with the built-in imagegen tool from the user's attached
Pitcairnia flammea photograph. The matching catalog reference is iNaturalist
photo 649834243 by filipeprates (CC0), observation 356347901. The catalog photo
and its metadata are unchanged. This generated artwork is a brand symbol.

The original generated file is preserved in
`assets/branding/pitcairnia-logo-master.png`. The user's revision removes the
green stem and lower red bracts, retaining the five flowers. Its master is
`assets/branding/pitcairnia-logo-master-v2.png`. Run `node scripts/export_branding.mjs`
to export the transparent header logo and favicon, opaque cream app icon,
Android adaptive foreground and monochrome alpha mask. Older leaf artwork
is retained. App configuration points to the new assets for the next native
build; website publication alone does not replace an installed APK's icon.

| Use | Saved asset |
| --- | --- |
| Original generated mark | [pitcairnia-logo-master.png](../assets/branding/pitcairnia-logo-master.png) |
| Current flower-only mark | [pitcairnia-logo-master-v2.png](../assets/branding/pitcairnia-logo-master-v2.png) |
| Header, loading and splash | [pitcairnia-logo.png](../assets/branding/pitcairnia-logo.png) |
| Browser favicon source | [pitcairnia-favicon.png](../assets/branding/pitcairnia-favicon.png) |
| Opaque 1024 px app icon | [pitcairnia-app-icon.png](../assets/branding/pitcairnia-app-icon.png) |
| Android adaptive foreground | [pitcairnia-foreground.png](../assets/branding/pitcairnia-foreground.png) |
| Android monochrome mask | [pitcairnia-monochrome.png](../assets/branding/pitcairnia-monochrome.png) |

## Generation prompt

Create one finished logo SYMBOL for the Brazilian native flora field guide
'Plantas do Rio de Janeiro', using the attached photograph as the botanical
reference. This is a new visual identity, not a photograph edit. The subject
must be recognizably the scarlet Pitcairnia flammea inflorescence from the
reference: a compact asymmetric fan of 5 elongated tubular red flowers rising
from a short graceful dark green/burgundy central stem; two tall upward tubes,
one leaning left, one leaning right, and a small lower bloom. Preserve the long
narrow tubular flower silhouettes and their tiny open tips, rather than drawing
a generic daisy or lily. Simplify boldly into a beautiful flat vector-like
botanical emblem with solid scarlet/coral red petals, a restrained deep red
accent and dark forest-green short stem. Broad clean shapes, a strong cohesive
silhouette, very little internal detail, legible as a 16–32 px browser favicon
and 48 px header icon. Square composition, flower fan fills about 85% of square,
balanced generous edges, no long dangling stalk. Actual transparent background.
No text, lettering, mockup, border, badge, circles, white backing, shadow,
photographic texture or gradients. Output a single centered polished emblem,
not a sheet of variants.

## Revision prompt (built-in imagegen edit)

Edit this exact existing Pitcairnia logo. Preserve the five red tubular flowers,
their arrangement and shapes, their scarlet/deep red colors, and the yellow
stamens with red tips. Remove ALL the green stem and branching green connectors,
and remove ALL four of the small dark red bracts/sepals growing below the flower
cluster. There should be no trunk, stalk, leaves, green pixels or dangling red
bracts at the bottom: only the compact fan of five red flowers with their
stamens. Keep the small actual flower at the lower left; that flower is not one
of the bracts to remove. The red flower bases may nest neatly together into a
coherent fan at the bottom without adding any stem. Recenter and enlarge the
remaining flower fan tastefully in a square canvas with balanced narrow margins
so it fills the available space and works as a favicon. Preserve the polished
clean flat vector-like style; do not redesign the flowers, add text, borders or
backing. Actual transparent background.
