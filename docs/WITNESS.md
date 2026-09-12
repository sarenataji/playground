# Witness: concept and continuation guide

This is the durable brief for the `/witness` room. Read it before changing the experience. It records the user's intended concept and the current implementation so future chats can continue without reconstructing the conversation.

## The intended discovery

The full progression is:

> Being absorbed in experience → noticing experience → noticing that the feeling of being its observer is also part of experience.

The viewer's seat is an intermediate discovery. The later inquiry is essential. Do not simplify the ending into an eternally separate, safe, calm observer watching life from outside. Conversely, do not skip the seat: beginners need to experience the first shift before the deeper question makes sense.

The user wants to show the concept as they see it, through an extended, scroll-driven visual experience. Someone with little familiarity with awareness should be able to follow it by the end. Each chapter should add a concrete visual change or interaction and a small amount of plain-language explanation. More scroll space should support new discoveries, rather than merely stretch an animation or add an essay.

## The movie, attention, and the first reveal

The movie includes the entire lived moment: the room, actions, thoughts, emotions, bodily sensations, memories, imagined conversations, and the personal story of who you are. The action is daily life; the dialogue is thought; the soundtrack is emotion.

The recurring example is an unanswered message. The observable situation is “no reply yet.” Then an interpretation appears: “They're disappointed in me.” A bodily response might follow, such as chest tension. Finally, a personal story appears: “I always mess things up.” Absorption means the interpretation starts to feel like the situation itself.

The opening room invites attention to the phone, window, and cup. Lingering on the message brings associations forward. The pullback reveals that the lived room is playing inside the television head of a seated figure. Keep the original scene continuous through the reveal. The message remains unanswered; what changes is the relationship to it and its apparent totality.

Use these working distinctions:

- Awareness: experience is present.
- Attention: particular aspects receive priority.
- Interpretation: meaning is given to those aspects.

Attention “affects the movie” through prominence, associations, and atmosphere. The same room can feel different as attention moves. Looking toward the window offers another detail; it does not guarantee happiness or resolve the message. Avoid suggesting that attention gives complete control over feelings or external events.

The first practical shift is: stop, notice a thought or feeling, and try “I am aware of…” For example, “I am angry” becomes “I am aware of a feeling of anger.” The feeling can remain while there is more room around it.

## The deeper inquiry

After establishing “I can watch this happening,” gently turn toward the felt watcher itself:

> What does this feeling of “me, watching” actually consist of?

It might include an inner sentence, a mental image of oneself, tension around the eyes, or a feeling of being located somewhere. Those can also be noticed. This is an invitation to investigate subjective experience, not a required conclusion or a test of spiritual attainment.

Do not introduce an endless chain of observers behind observers. The visual boundary and the camera's apparently privileged position should eventually soften. The user should be invited to explore whether experience requires another separate watcher to continue.

“Gallery White” expresses openness artistically. It does not mean awareness must be blank, emotionless, or permanently calm. “Effortless” means experience can continue without repeatedly thinking “I am aware”; it is not a biological claim about energy or a promise that practice takes no effort.

The ending returns to participation. Thoughts, feelings, and the sense of self can still appear. The person can care about the relationship, respond to the message, make choices, and live. Do not portray the character as something to dismiss or escape.

## Current visual journey

| Chapter | Phase | Visual or interaction | What it introduces |
| --- | --- | --- | --- |
| 1. The movie | `inside` | A living 3D room with phone, window, and cup hotspots | An ordinary moment can feel like everything |
| 2. The story | `story` | Scroll reveals a message, interpretation, and identity statement in layered cards | The difference between what happened and what was added |
| 3. The soundtrack | `sensation` | A body outline with pulsing chest rings | Thought and sensation color the moment together |
| 4. A little distance | `pullback` | Continuous camera retreat out of the room and through the TV-head reveal | The experience remains while the frame widens |
| 5. The viewer | `orbit` | A seated TV-headed figure; mouse, drag, arrow keys, and view buttons | The useful first step of observing |
| 6. Attention edits | `attention` | Return toward the live room; select message, window, or cup | Attention changes foreground and interpretation |
| 7. Make the shift | `observer` | Choose a feeling and reframe it; the visual card gains space around it | Practice noticing without removing the feeling |
| 8. Notice the watcher | `inquiry` | Explore inner voice, mental image, and felt location; the lens changes | The felt observer can also be noticed |
| 9. An open frame | `unframe` | The figure fades and a boundary expands away among experiential fragments | No additional watcher needs to be illustrated |
| 10. Life continues | `rest` | The living room softly returns behind the open composition | Experience and participation continue |

The section after the scroll journey summarizes the three shifts and provides an interactive check-in. It reinforces noticing rather than trying to blank the mind or maintain a perfectly calm watcher.

Current examples use a single continuous afternoon. Further situations or visual variations are welcome if each clarifies the concept and preserves the full progression. Ten chapters is the current structure, not a permanent limit.

## Implementation map

- `src/pages/Witness.tsx`: chapter content, scroll state, navigation, attention controls, feeling practice, watcher exploration, and final reflection.
- `src/pages/witnessExperience.ts`: chapter boundaries, local progress, and the mapping from expanded story progress to the existing continuous camera path.
- `src/pages/WitnessScene.tsx`: two Three.js scenes. The living room renders into a texture on the figure's CRT head. Includes room animation, attention effects, projected hotspots, camera reveal/orbit, and the final room return.
- `src/pages/witness.css`: layout, mobile adaptations, illustrated cards/body/lens/fragments, and motion preferences.
- `tests/witness.test.mjs`: chapter traversal and continuity/bounds of the camera mapping.

The journey currently uses 1800svh on desktop and 1900svh on mobile. Scroll works in both directions; chapter navigation and previous/next controls provide alternatives. Preserve keyboard access, pause behavior, and reduced-motion support. A paused experience must still show newly entered chapter text. If WebGL fails, keep the explanatory chapters and exercises usable.

## Validation

Run:

```sh
npm run build
node --test tests/witness.test.mjs
```

Visually check desktop and short mobile viewports, particularly the story stack, practice card, inquiry panel, footer clearance, and opening/ending transitions. Check attention selection, feeling reframing, watcher selection, backward navigation, and pause behavior. The latest implementation passed the build and camera/chapter tests and was inspected at 1280×800, 390×844, and 375×667. These checks are not a substitute for testing future changes.

## Background supplied by the user

The user connects the concept with Sam Harris's inquiry into the apparent observer, Alan Watts's warning about adopting a higher witnessing identity, Ram Dass's warm and nonjudgmental witnessing, and Douglas Harding's first-person perspective experiments. These are overlapping influences, not identical teachings.

The user also supplied research about decentering, attention and perceptual appearance, and flexible self-related processing. Treat those as background for the artistic inquiry. Do not present the visual metaphor as scientific proof of a complete theory of consciousness. If adding research claims or citations to the product, read and verify the primary sources first.

The creative brief takes priority: help someone investigate their own experience, step by step, through visuals they can understand.
