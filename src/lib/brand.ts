export const BRAND_PRESETS = [
  { name: "Orange", hue: 24, sat: 95 },
  { name: "Blue", hue: 210, sat: 90 },
  { name: "Purple", hue: 270, sat: 80 },
  { name: "Pink", hue: 330, sat: 85 },
  { name: "Red", hue: 0, sat: 85 },
  { name: "Green", hue: 142, sat: 75 },
  { name: "Teal", hue: 180, sat: 70 },
  { name: "Yellow", hue: 45, sat: 95 },
] as const;

export const DEFAULT_HUE = 24;
export const DEFAULT_SAT = 95;

export function applyBrandColor(hue: number, sat: number) {
  const root = document.documentElement;

  root.style.setProperty("--brand", `${hue} ${sat}% 53%`);
  root.style.setProperty("--brand-muted", `${hue} ${Math.round(sat * 0.63)}% 30%`);
  root.style.setProperty("--brand-subtle", `${hue} ${Math.round(sat * 0.42)}% 12%`);

  root.style.setProperty("--graph-1", `hsl(${hue} ${Math.round(sat * 0.42)}% 18%)`);
  root.style.setProperty("--graph-2", `hsl(${hue} ${Math.round(sat * 0.63)}% 28%)`);
  root.style.setProperty("--graph-3", `hsl(${hue} ${Math.round(sat * 0.84)}% 40%)`);
  root.style.setProperty("--graph-4", `hsl(${hue} ${sat}% 53%)`);
}

export function saveBrandColor(hue: number, sat: number) {
  try {
    localStorage.setItem("forge-brand", JSON.stringify({ hue, sat }));
  } catch {}
}

export function loadBrandColor(): { hue: number; sat: number } | null {
  try {
    const raw = localStorage.getItem("forge-brand");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.hue === "number" && typeof parsed.sat === "number") return parsed;
  } catch {}
  return null;
}
