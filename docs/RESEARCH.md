# Motion research: Zero, Lando Norris, Slosh

Sources used: live sites, official case studies, and engineering write-ups. Visual identity for *this* project comes from the editorial “Welcome to the playground” reference (cream paper, Didone type, circular studio stamp) — not from the three sites’ palettes.

## 1. why.zero.university — ZERO

**Studio:** BUNQ LABS for Zero University  
**Write-up:** [Codrops, July 2026](https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/)  
**Stack:** Vite, Three.js, custom GLSL, GSAP (timelines only — no ScrollTrigger), Howler, DRACO / KTX2

### Structure
A locked first screen. No enter button. Draw a zero. Frost blooms from the stroke and the world opens. After that: one continuous WebGL scroll through six narrative stages, with five “gates” that pause the story (draw, hold-to-shatter, hold-to-launch). The last stage hands the user an interactive city map.

### Motion system
Native scroll is abandoned. Wheel and touch update a **virtual scroll number** that eases toward a target. Every loader, shader uniform, text overlay, and camera move is a function of that single value.

Each stage is a segment:

```
scrollVh, enter(), scrub(p 0..1), update(t, dt), teardown()
```

### Signature techniques
| Technique | How it works |
|---|---|
| Gesture gate | Signed winding angle ≈ 2π, low radius variance, start/end close → unlock. Centroid seeds the frost. |
| Frost shader | Ping-pong trail, four-axis spread (octagon), frost luma modulates growth, then radial melt. |
| Hold gates | Shared press-and-hold; visuals driven by hold progress 0..1; shatter snaps a dark-red grade back in ~200ms. |
| Custom moment shaders | Glass refraction, noise-field money burn, certificate shred by strip index, ZERO-logo tunnel pulse. |
| Deferred type | Text composited after tone mapping so it stays sharp; hexagonal blur pulls copy into focus. |
| Adaptive quality | Rolling frame times step pixel ratio / blur / geo. Story stays the same on a budget phone. |

### UI takeaway
The site is a **ritual**, not a landing page. Interaction is the argument. Copy is sparse, cinematic, and timed to shaders.

---

## 2. landonorris.com — Lando Norris

**Studio:** OFF+BRAND  
**Case study:** [itsoffbrand.com/our-work/lando-norris](https://www.itsoffbrand.com/our-work/lando-norris)  
**Stack breakdown:** [Wes Bos / Syntax, Oct 2025](https://www.youtube.com/watch?v=HzL65tTeANs)  
**Stack:** Webflow shell, custom JS, Three.js + GLSL, Rive, Lenis, GSAP. (jQuery/tram ship because of Webflow; they are unused.)

### Structure
A high-performance athlete home: kinetic hero, then On Track / Off Track / Helmet hall / partners. Horizontal photo strips, blob-shaped crops, page transitions, a drawn signature.

### Motion system
- **Lenis** owns scroll (including sideways sequences). Feels native enough that sticky and nested axes still work.
- Hero is **seven–eight stacked WebGL layers**: photo, 3D helmet (glTF + maps), glass, blob metaball mask that decides what you see.
- Helmet tracks the pointer and swaps livery on hover / easter egg (`disco`).
- **Rive** for signature draw, circuit doodles, UI glyphs, and page-transition marks — motion design exported to WASM, not timeline-coded.
- Type is oversized, split, and often clipped into non-rectangular CSS shapes (`mask-image` / organic clip paths).
- Transforms over filters: performance comes from moving layers, not blurring the whole page.

### Signature techniques
| Technique | How it works |
|---|---|
| Metaball / blob mask | SDF blobs in a shader, used as a mask between two hero treatments. |
| Pointer-driven 3D | Helmet (and maps) lerp toward cursor; parallax on stacked planes. |
| Kinetic type | Giant wordmarks, staggered lines, signature stroke reveal. |
| Organic UI | Buttons and image frames are blobs, not rectangles. |
| Drawn marks | Signature and circuits animate as if a hand is in the file. |
| Easter eggs | Typed codes swap the 3D hero. |

### UI takeaway
Identity lives in **material** (helmet, lime, signature) and in **crop language** (blobs). Scroll is cinematic but the site remains a real multi-page brand home.

---

## 3. sloshseltzer.com — Slosh Seltzer

**Studio:** Active Theory (Buttermax)  
**Write-up:** [Awwwards, The Story of Slosh](https://www.awwwards.com/the-story-of-slosh.html)  
**Stack:** Active Theory **Hydra** (proprietary WebGL engine). Public tags: WebGL, liquid, colorful. Awards: Awwwards SOTD, CSSDA WOTM.

### Structure
You enter by **popping a can**. Scroll fills the viewport with seltzer and drops you into a party: flying fruit, dancing type, pong, cheers. Maximalist food-and-drink brand, loud type, hand-drawn bits, patterned 3D cans.

### Motion system
- Entry is a **physical metaphor** (open the can), not a loader bar.
- **Liquid fill** is the page transition — the product *is* the scroll.
- **GPU fluid cursor** with carbonation bubbles (stable-fluids / Navier–Stokes on the GPU, same family as [PavelDoGreat’s WebGL fluid](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)).
- Delight first: games and cursor toys are the UX, copy is seasoning.
- They pivoted from illustration to 3D product shots on flat, loud patterns so the can could pop.

### Signature techniques
| Technique | How it works |
|---|---|
| Can-open gate | A single branded gesture starts the site. |
| Liquid page fill | Rising / sloshing fluid as a wipe between scenes. |
| Fluid mouse | Velocity splats into a dye field; bubbles ride the vorticity. |
| Playable asides | Mini-games as brand, not as extra. |
| Dancing type | Letters as particles / physics objects. |

### UI takeaway
If the user cannot taste the product, **make them feel the material**. Fluid is not decoration; it is the medium.

---

## Libraries we actually need (and why)

| Library | Used by | Role here | Ship? |
|---|---|---|---|
| **Three.js + R3F + Drei** | Zero, Lando | 3D stamp, blob-mask planes, work-card scenes | Yes |
| **GSAP + SplitText + @gsap/react** | Zero, Lando | Type, gates, liquid wipe, signature stroke | Yes (free club plugins) |
| **Lenis** | Lando | Smooth scroll synced to GSAP ticker | Yes |
| **Custom GLSL / WebGL2** | All three | Frost, GPU fluid, metaballs | Yes, written here |
| **Howler** | Zero | Full sound design | No for v1 — tiny Web Audio chime only |
| **Rive** | Lando | Hand-drawn marks | No — SVG + DrawSVG-style GSAP instead (no .riv pipeline) |
| **Hydra** | Slosh | Their private engine | No — we cannot ship it |
| **DRACO / KTX2** | Zero, Lando | Heavy 3D assets | Later, when real GLBs land |
| **Webflow / jQuery** | Lando | CMS shell | No |

Hydra and Rive are the two “we don’t have them” pieces. Hydra is closed. Rive is downloadable but wants a design-tool file. For this playground, GSAP-drawn SVG plus our own shaders is the better fit.

---

## What we will not copy

- Zero’s education-manifesto story, glass shatter, or city map.
- Lando’s lime McLaren identity, helmet GLB, or Webflow page model.
- Slosh’s pink maximalism, fruit physics, or alcohol branding.

We copy **mechanics**, not skins. The skin is the cream Didone playground in the attached frame.
