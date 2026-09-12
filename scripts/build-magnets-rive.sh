#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
rive assets/rive/magnets --verify
mkdir -p assets/rive/magnets/build
rive inspect assets/rive/magnets --json > assets/rive/magnets/build/inspect.json
rive assets/rive/magnets --once
cp assets/rive/magnets/build/magnets.riv public/rive/magnets.riv
