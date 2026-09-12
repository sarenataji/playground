# Bloom animation

`scene.rml` is the editable Rive source for the central flower. It contains vector petals, leaves and stem, a looping breeze, a tap flutter, and blended poses for opening and following the pointer. No scripts, remote artwork, or signing service are needed.

Run `sh scripts/build-bloom-rive.sh` from the repository root after editing. The Rive CLI verifies and inspects the scene, builds the asset, and copies it to `public/rive/bloom.riv`. The app serves it at `/rive/bloom.riv`. The compiled file is committed so running or building the website does not require the CLI.

`BloomMachine` keeps the existing application's input contract:

- `cursorX`, `cursorY`: numeric blend axes, 0–100, centered at 50.
- `bloomProgress`: numeric blend axis, 0–100.
- `tapBloom`: trigger for the petal flutter.

The flower is declared as a reusable component; its internal machine uses inputs so it can also be nested without depending on a parent view model. The React garden currently draws the additional planted flowers on a shared canvas to avoid creating a runtime and renderer for every bloom.
