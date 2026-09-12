# Entry ritual artwork

`src/components/Gate.tsx` loads `public/rive/gate_frost.riv` at `/rive/gate_frost.riv`. This asset is currently missing and must be supplied to preview the vector frost melt.

The default artboard’s first state machine must contain both inputs below. Its name is unrestricted.

| Input | Type | Value |
| --- | --- | --- |
| `drawProgress` | Number | Cumulative stroke length in CSS pixels. Starts at zero for each new attempt and resets after an invalid or cancelled stroke. |
| `unlockTrigger` | Trigger | Fired once after `isHeart(points)` accepts the gesture. |

The trigger must start the complete frost melt and dissolution sequence. At its end, report a General Rive event named `onComplete`, or transition to the terminal `Exit` state. Reserve that exit for completion of the full ritual; intermediate state changes do not unlock the page. The runtime has no generic `onComplete` callback, so the component subscribes to `EventType.RiveEvent` and `EventType.StateChange`.

The drawing canvas is transparent above the Rive canvas after loading. Include the entire frost appearance in the artwork. During loading or on failure, the drawing canvas supplies a static cream background. A valid heart is queued while loading; on a load error or missing inputs it unlocks immediately. The “I am already home” button always bypasses the ritual. Reduced-motion users bypass immediately without mounting Rive.
