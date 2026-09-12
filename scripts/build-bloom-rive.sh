#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
rive assets/rive/bloom --verify
mkdir -p assets/rive/bloom/build
rive inspect assets/rive/bloom --json > assets/rive/bloom/build/inspect.json
rive assets/rive/bloom --once
cp assets/rive/bloom/build/bloom.riv public/rive/bloom.riv
