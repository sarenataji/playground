let ctx: AudioContext | null = null;

function audio() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playTone(freq: number, duration = 1.15, gain = 0.055) {
  const c = audio();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

export function playUnlockChime() {
  playTone(392, 0.9, 0.05);
  window.setTimeout(() => playTone(494, 0.9, 0.045), 50);
  window.setTimeout(() => playTone(587, 1, 0.04), 110);
}
