# Alternate indexed frame

Generated with imagegen as a neutral, colourable gothic frame. `index-frame-source.png` is the original 992 × 1586 RGBA output; `index-frame.webp` is a lossless web copy.

Prompt: Production card frame only, tall 5:8 playing card, rounded corners. Strict grayscale neutral silver palette for software suit tinting. Restrained gothic engraving only around the narrow perimeter. No pictures, symbols, lettering, numbers, header/footer bars, or watermark. Interior and exterior actual alpha transparent. Two large blank ivory index panels, top-left and bottom-right, exact 180-degree counterparts, with thin outlines and no inner ornament. Spacious enough for an enormous rank above a large suit symbol. Prioritize hierarchy and uncluttered index areas over decoration. Entire frame visible.

The component combines the frame’s alpha with a live suit colour and its neutral engraving layer. Rank text and suit symbols are live elements, not baked into the frame. Current deck assets and defaults are unchanged.

## Pentacles symbol

A single clear pentacle suit symbol: an upright five-pointed interlaced pentagram enclosed in a circular ring, bold thick strokes, neutral engraved silver, readable at 24px. All spaces between and within the strokes, including the central pentagon, are actual transparent holes. No solid coin face, decoration, text, numbers, shadow backdrop, or watermark. Full isolated symbol with margin; intended for an alpha mask coloured by software.

## Bridge-card court portraits

The 16 replacement portraits were generated individually with the built-in `image_gen.imagegen` tool, using existing court artwork as references. Pages, Knights, and Queens use their own corresponding original portraits as identity references, rather than sharing one reference per suit. Exact per-card prompts and saved asset names are recorded in `courts/PROMPTS.json`; lossless full-resolution images live in `courts/full/`. The shared composition reserves the upper-left index area and places the face centrally and the identifying held object on the right. Artwork is repeated in opposing halves without stretching; responsive derivatives are prepared by `scripts/prepare-alternate-art.ts`.

The current layout uses the original full-colour suit symbols from `art/cards`, rather than the experimental Pentacles mask above. `scripts/prepare-alternate-frame.ts` derives the frame silhouette and separates its blank index wells so all paper regions share one uniform suit tint. Frame engraving sits above labels and indexes; artwork joins along a diagonal through the centre, without a horizontal separator or gradient.

Number-card paper is a single full-height masked surface, independent of the two opposing frame/index layers, so fractional pixel heights cannot expose a horizontal background seam.

## Minor Arcana back

Generated with the built-in `image_gen.imagegen` tool, using `art/cards/back-minor.webp` as reference. The original generated image is `back-minor-source.png`; the lossless web asset is `back-minor.webp`. The component fits the entire illustration uniformly within the approved card proportions, using black behind any remaining edge space; no cropping or stretching.

Prompt: Use case: stylized-concept. Generate a production-quality alternate Minor Arcana playing-card BACK for Hell's Bells using the supplied original back as a style reference. Recompose its sumptuous crimson velvet, intricate gold engraved foliage, black accents, cream lilies and ornate bell/suit medallions into a LESS TALL playing-card canvas. Exact desired output size 1008 by 1408 pixels, width:height 63:88. It is crucial the complete narrow outer gold frame and all four rounded corners fit INSIDE this new aspect ratio with an even narrow black edge beyond the frame. Nothing cut off, no bleed beyond canvas, no mockup or perspective. Match the rich detailed Renaissance gothic artwork in the reference. Make the entire design double-ended and rotationally symmetric: paired opposing decorative bells, a balanced central medallion and corresponding gold filigree at both ends. No single upright orientation. No text, letters, ranks, numbers, watermark, hands, table, extra cards or margins. Fill the exact card canvas; one card-back image only. Artwork must be composed for this aspect ratio, not a stretched or cropped tall card.

Online play and the animation lab use transparent exterior edges. Physical component previews and print rendering keep the black edge. `scripts/prepare-alternate-back-mask.ts` derives `back-minor-surface.webp` from the exterior black region, leaving the printable back asset untouched; the mask is applied only to online card backs. Fronts retain their existing alpha silhouettes and use a transparent exterior background online.

## Shared bridge family and material palette

The active shared design now uses 56 × 88 mm bridge proportions for every front and back. `src/lib/art/card-theme.ts` defines the single size, A/2–10/P/N/Q/K indexes, and material themes: gold Pentacles, silver Cups, iron Swords, velvet-red Wands, and copper imps. Flat dark paper and light text replace the earlier pastel fills. Text contrast is tested above 7:1.

`index-frame-bridge.webp` is a uniformly fitted/padded derivative of the original neutral frame; no engraving is stretched. Court screen derivatives use the bridge illustration window. `backs/` holds all four bridge-proportioned backs and separate online-edge masks; `scripts/prepare-bridge-backs.ts` reproduces them. Suit icon generation prompts and source provenance are in `suits/PROMPTS.json`. Existing paintings and game mechanics are retained.

Print-and-play defaults to native bridge sheets. Optional tall and poker sheets keep the same bridge artwork proportionally fitted, with black print trim. Online play and the animation lab keep transparent exterior edges.
