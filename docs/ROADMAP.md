# Roadmap — The Playground of Sarena

## Concept (locked for v1)

The site is not a grid of case studies. It is a **studio you enter**.

**Material:** ink on cream paper.  
**Ritual:** you draw a closed loop (a zero / an O / a stamp) to melt the frost.  
**Function:** a live GPU ink table that is also the cursor, the page wipe, and the way work is revealed.

Three references become three verbs:

1. **Zero → draw / hold / one number drives the show**
2. **Lando → blob-mask, pointer-tracked 3D, drawn signature, kinetic type**
3. **Slosh → liquid fill, fluid cursor, playable medium**

Hero copy, matching the attached frame:

> Welcome to the  
> playground    [studio stamp]  
> of Sarena

## Design system

| Token | Value |
|---|---|
| Paper | `#F3EEE6` |
| Ink | `#161412` |
| Dust | `#8A8175` |
| Ember | `#C45C26` (hold-gate accent, from Zero’s snap, quiet) |
| Display | Bodoni Moda |
| UI | Outfit |
| Radius language | Circles and metaballs, almost no 8px cards |
| Cursor | Hidden on fine pointers; ink is the cursor |

## Site spine (v1, this build)

```
[GATE] draw a circle → frost melt
   ↓
[HERO] Didone wordmark + 3D stamp + blob field + hand arrow
   ↓
[VERBS] three columns: Draw / Blob / Slosh
   ↓
[SHATTER] hold gate, glass shards + gravity
   ↓
[GRAVITY TYPE] falling / draggable letters
   ↓
[MAGNETS] Coulomb field, pull / push
   ↓
[CORRIDOR] pinned sideways blob panels
   ↓
[STUDIES] four work rooms
   ↓
[SPRINGS] lattice you can tug
   ↓
[TUNNEL] scroll as depth
   ↓
[INK TABLE] GPU fluid
   ↓
[ARENA] colliding bodies
   ↓
[CLOSE] signature stroke
```

Lenis + GSAP ticker. Fluid and Three.js run on the same `gsap.ticker` / rAF so DOM and WebGL do not drift (the HAOQI / Trionn lesson).

## Phases

### Phase 0 — Research (done)
Document stacks and steal only mechanics. See `docs/RESEARCH.md`.

### Phase 1 — Playable spine (this repo)
- Vite + React + TypeScript
- Frost gate with Zero-style loop detection
- Persistent GPU fluid cursor (Slosh)
- Hero layout from the reference frame
- Pointer-tracked 3D smile stamp (Lando, without a helmet GLB)
- Blob-mask study cards
- Liquid ink wipe between the manifesto and the ink table
- Split type + SVG signature
- Reduced-motion: skip gate, hide fluid, static type
- Easter egg: type `ink`

### Phase 2 — Real work
Replace study placeholders with Sarena’s projects. Each project gets a blob-mask still, a short verb, and a hold-to-open case layer.

### Phase 3 — Sound + quality
Howler beds for gate / dump / signature. Adaptive pixel ratio like Zero. KTX2 if we add photography.

### Phase 4 — Multi-page
On / off “track” style index (Lando) only if the body of work needs it. Until then, one scroll is the product.

## Engineering rules

1. One clock. Lenis `raf` from GSAP ticker (or the reverse), never two rAFs fighting.
2. Fluid sim stays low-res; display is the full canvas.
3. Gates always have a text skip. Drawing is the joy path, not the only path.
4. Prefer transforms, masks, and uniforms over CSS filters.
5. Test the gate with a real pointer; a screenshot of the hero is not the product.
