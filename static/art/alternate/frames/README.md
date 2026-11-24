# Illustrated frame family

Nine complete RGBA frames generated individually with the built-in `image_gen.imagegen` tool. Playing frames use gold, silver, iron, and red leather; companion power frames add copper for imps. The original frame layouts and minor-card back were supplied as geometry and craftsmanship references. Exact prompts and source provenance are in `PROMPTS.json`.

The shared card components draw these full-colour images directly. No tint, texture overlay, or blend mode recolours the frame. Live text sits on flat paper beneath it.

`*-source.png` preserves each generated output. Preparation uniformly fits the artwork to 1008 × 1584, mirrors playing-card halves for exact rotational symmetry, and derives paper silhouettes and index openings. Power portrait bounds follow each illustrated frame's actual divider positions, stored in `src/lib/art/crafted-frame-layouts.json`.

Rebuild derivatives with:

```sh
bun scripts/prepare-crafted-frames.ts static/art/alternate/frames/PROMPTS.json
```
