# Magnets

`scene.rml` is the source for `public/rive/magnets.riv`. Rebuild with:

```sh
sh scripts/build-magnets-rive.sh
```

The default 1000 × 600 artboard runs `MagnetsMachine`:

| Numeric input | Range | Meaning |
| --- | --- | --- |
| targetX | 0–100 | Left to right; neutral 50 |
| targetY | 0–100 | Top to bottom; neutral 50 |
| speed | 0–100 | Normalized cursor distance per second, capped at 100 |
| mode | 0 or 1 | Pull or push (reverses the field target) |

Six cubic vector membranes are skinned to two-bone chains. Translation
constraints move the IK targets with the cursor. Rive's internal IK solver
bends the membranes; speed above 8 enters the stretched pose, and stopping
blends back over 900 ms with Rive's elastic interpolator. This uses IK and
elastic interpolation, not a numerical spring simulation or scripted physics.
The asset has no scripts and needs no script signing.

The React component maps pointer events through the centered `Fit.Contain`
artboard, writes inputs directly, and resets speed after 100 ms without motion.
Pointer exit/cancel resets the target. Playback pauses offscreen, in hidden tabs,
and when reduced motion is requested. No application animation loop is used.

Validation: run `--verify`, `rive inspect assets/rive/magnets --json`, and
`rive assets/rive/magnets --screenshot=/tmp/magnets.png --advance=60`.
Inspect validates structure; a runtime render is also needed to check skins.
