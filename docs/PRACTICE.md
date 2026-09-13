# Practice: implementation and next rooms

## Scope and preservation

Practice is an addition to the existing site. Preserve the original homepage, all existing rooms, and the complete Witness journey. Before making any Witness changes, read WITNESS.md. The first Practice implementation does not edit Witness.

The intended path is Witness → Layers → The Gap → Inner Weather → Mind Patterns → Soften → Direction → Just Be. Each room should make a discovery visible and offer a small experiment; motion should explain a relationship, with concise language supporting it. Observing should lead back to participation, without requiring calm or a permanently separate observer.

## Built

- `/practice`: a seven-room map. Layers and The Gap are open. The other five cards explicitly say “Coming later” and are not links to nonexistent pages.
- `/practice/layers`: five scroll chapters—All at once, Name the layer, Directly here, Pain + commentary, No conclusion. A sticky illustrated phone and translucent planes change as the chapters change. Visitors select layers, explore observable details versus interpretations, set illustrated commentary aside, and optionally inquire into the felt observer. Previous/next controls and chapter buttons provide scroll alternatives. The motion pause still permits chapter and exercise changes.
- `/practice/gap`: an imagined tense conversation, a three-second noticing exercise, and several possible responses. The timer supports pause/resume, reset, and an untimed option. Time while the document is hidden does not count toward the pause. No example response sends a message. The final reflection explores urgency without treating it as proof.

Practice is available through the main navigation and room map. Every new route is lazy-loaded and has its own registered theme. Mobile navigation scrolls horizontally when needed; the existing Breathe/Dawn compact-navigation omissions use href selectors so inserting a link does not inadvertently hide Rooms.

## Implementation

- `src/pages/practice/Practice.tsx`: room map and availability.
- `src/pages/practice/Layers.tsx`: scroll chapter tracking, layer and detail selection, commentary toggle, deeper inquiry.
- `src/pages/practice/Gap.tsx`: timer and response exploration.
- `src/pages/practice/practice.css`: shared Practice styling and room-specific visuals.
- `src/App.tsx`: lazy imports and routes.
- `src/lib/rooms.ts`: themes and room-map entries.
- `src/components/Nav.tsx`: Practice link and active state for nested routes.
- `src/styles.css`: compact navigation overflow.

The new visuals use CSS rather than a new WebGL dependency. They remain usable without canvas. Horizontal overflow is clipped on the three new route themes so the body does not become a separate scroll container that breaks sticky positioning. Reduced motion disables transitions and ambient morphing; the Gap timer remains usable and its rings stay static. On short mobile viewports the Layers illustration becomes more compact.

## Remaining roadmap

1. **Inner Weather** (`/practice/inner-weather`): habit 7. States as changing atmospheric conditions; allow multiple states and do not require a sunny ending. Preserve the existing `/weather` room.
2. **Mind Patterns** (`/practice/patterns`): habits 10, 11, 12. Branching thoughts and recurring protective loops; allow an unfinished thought without making disappearance a success condition.
3. **Soften** (`/practice/soften`): habits 8, 9, 13. Body locations, small releases of tension, and investigation of contraction/opening without treating them as a moral or decision test.
4. **Direction** (`/practice/direction`): habits 15, 18. “And” connects feelings with possible actions; values orient a small step while emotional weather remains.
5. **Just Be** (`/practice/be`): habit 20. Optional 5/10/15-minute or untimed stillness with minimal visual activity and no score.
6. **Witness companions**: habits 5, 14, 16, 17. Mental movies, self-image camera, observer identity, and noticing the watcher. Add optional entry points or companion exercises while preserving the complete existing journey.

Layers covers habits 1, 2, 6, 19. The Gap covers habits 3, 4. Build each remaining room completely before marking it open; update map availability and routes together.

## Validation

Run `npm run build` and `node --test tests/*.test.mjs`.

Browser checks for this milestone covered 1280×800, 390×844, and 375×667; map links, sticky stage and chapter controls, selection and interpretation explanations, commentary toggle, deeper inquiry, backward navigation while paused, timer pause/resume/reset/untimed behavior, response selection, keyboard activation, reduced motion, and browser back navigation. No page exceptions were observed in the automated check. The existing gate can emit Rive asset load errors in the preview; this milestone does not change that asset.

For future changes, recheck sticky positioning after global overflow changes, short-mobile text clearance, direct deep links, and timer cleanup on route changes. Do not claim the remaining rooms are implemented until their experiences exist.
