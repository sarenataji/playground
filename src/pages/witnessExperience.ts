export type Attention = "message" | "window" | "cup" | null;
export type WitnessPhase = "inside" | "pullback" | "orbit" | "attention" | "observer" | "rest";
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export function phaseAt(p: number): WitnessPhase {
  if (p < .16) return "inside";
  if (p < .38) return "pullback";
  if (p < .56) return "orbit";
  if (p < .74) return "attention";
  if (p < .91) return "observer";
  return "rest";
}
export const phaseStops = [.0, .22, .43, .63, .8, .95];
