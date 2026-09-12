export type Attention = "message" | "window" | "cup" | null;
export const chapters = [
  { phase: "inside", start: 0, label: "The movie", hint: "Scroll slowly. Each chapter opens another part of the experience." },
  { phase: "story", start: .09, label: "The story", hint: "Keep scrolling. Watch a fact grow into a story." },
  { phase: "sensation", start: .18, label: "The soundtrack", hint: "A thought. A sensation. Together they color the moment." },
  { phase: "pullback", start: .27, label: "A little distance", hint: "Scroll to pull back. The original scene stays alive." },
  { phase: "orbit", start: .37, label: "The viewer", hint: "Look around the figure. This is a useful place to begin." },
  { phase: "attention", start: .46, label: "Attention edits", hint: "Try each detail. Notice what becomes prominent." },
  { phase: "observer", start: .56, label: "Make the shift", hint: "Try noticing a feeling before moving on." },
  { phase: "inquiry", start: .66, label: "Notice the watcher", hint: "Explore the felt watcher. There is no answer you have to find." },
  { phase: "unframe", start: .77, label: "An open frame", hint: "Keep scrolling. The boundary softens; experience continues." },
  { phase: "rest", start: .89, label: "Life continues", hint: "Stay for a moment, or scroll down to take this into your day." },
] as const;
export type WitnessPhase = typeof chapters[number]["phase"];
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const chapterAt = (p: number) => chapters.reduce((current, chapter, index) => p >= chapter.start ? index : current, 0);
export const phaseAt = (p: number): WitnessPhase => chapters[chapterAt(p)].phase;
export const phaseStops = chapters.map(chapter => chapter.start);
export const localProgress = (p: number) => {
  const index = chapterAt(p);
  return clamp01((p - chapters[index].start) / ((chapters[index + 1]?.start ?? 1) - chapters[index].start));
};
// Preserve the continuous TV-head camera reveal while giving each idea its own scroll space.
const cameraStops = [0, .055, .11, .16, .39, .56, .8, .84, .9, .97, 1];
export function cameraProgressAt(p: number) {
  const index = chapterAt(p);
  return cameraStops[index] + (cameraStops[index + 1] - cameraStops[index]) * localProgress(p);
}
