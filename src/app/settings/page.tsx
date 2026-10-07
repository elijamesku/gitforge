"use client";

import { useEffect, useState } from "react";
import { BRAND_PRESETS, DEFAULT_HUE, DEFAULT_SAT, applyBrandColor, saveBrandColor, loadBrandColor } from "@/lib/brand";

function hexToHueSat(hex: string): { hue: number; sat: number } | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { hue: 0, sat: 0 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { hue: Math.round(h), sat: Math.round(s * 100) };
}

function hueSatToHex(hue: number, sat: number, l = 53): string {
  const s = sat / 100;
  const ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function SettingsPage() {
  const [hue, setHue] = useState(DEFAULT_HUE);
  const [sat, setSat] = useState(DEFAULT_SAT);
  const [hexInput, setHexInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = loadBrandColor();
    if (loaded) {
      setHue(loaded.hue);
      setSat(loaded.sat);
      setHexInput(hueSatToHex(loaded.hue, loaded.sat));
    } else {
      setHexInput(hueSatToHex(DEFAULT_HUE, DEFAULT_SAT));
    }
  }, []);

  function apply(h: number, s: number) {
    setHue(h);
    setSat(s);
    setHexInput(hueSatToHex(h, s));
    applyBrandColor(h, s);
    saveBrandColor(h, s);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleHexSubmit() {
    const result = hexToHueSat(hexInput);
    if (result) apply(result.hue, result.sat);
  }

  function handleReset() {
    apply(DEFAULT_HUE, DEFAULT_SAT);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-lg font-semibold text-foreground">Settings</h1>
      <p className="mb-8 text-xs text-foreground-lighter">
        Customize your Forge experience.
      </p>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-1 text-sm font-medium text-foreground">Brand color</h2>
        <p className="mb-5 text-xs text-foreground-muted">
          Choose an accent color used across the entire app.
        </p>

        <div className="mb-5 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {BRAND_PRESETS.map((preset) => {
            const active = hue === preset.hue && sat === preset.sat;
            return (
              <button
                key={preset.name}
                onClick={() => apply(preset.hue, preset.sat)}
                className={`group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors ${
                  active ? "bg-surface-200" : "hover:bg-surface-100"
                }`}
              >
                <span
                  className={`block h-8 w-8 rounded-full ring-2 transition-all ${
                    active ? "ring-foreground scale-110" : "ring-transparent group-hover:ring-border"
                  }`}
                  style={{ background: `hsl(${preset.hue} ${preset.sat}% 53%)` }}
                />
                <span className="text-[9px] text-foreground-muted">{preset.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium text-foreground-light">Custom color</label>
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="color"
                value={hueSatToHex(hue, sat)}
                onChange={(e) => {
                  const result = hexToHueSat(e.target.value);
                  if (result) apply(result.hue, result.sat);
                }}
                className="h-9 w-12 cursor-pointer rounded-md border border-border bg-surface-100"
              />
            </div>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleHexSubmit()}
              onBlur={handleHexSubmit}
              placeholder="#f97316"
              maxLength={7}
              className="w-28 rounded-md border border-border bg-surface-100 px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium text-foreground-light">Hue</label>
          <input
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={(e) => apply(Number(e.target.value), sat)}
            className="h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right,
                hsl(0 ${sat}% 53%),
                hsl(60 ${sat}% 53%),
                hsl(120 ${sat}% 53%),
                hsl(180 ${sat}% 53%),
                hsl(240 ${sat}% 53%),
                hsl(300 ${sat}% 53%),
                hsl(360 ${sat}% 53%)
              )`,
            }}
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-medium text-foreground-light">Saturation</label>
          <input
            type="range"
            min={10}
            max={100}
            value={sat}
            onChange={(e) => apply(hue, Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{
              background: `linear-gradient(to right,
                hsl(${hue} 10% 53%),
                hsl(${hue} 50% 53%),
                hsl(${hue} 100% 53%)
              )`,
            }}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-surface-100 p-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground-light">Preview:</span>
            <span
              className="h-5 w-5 rounded-full"
              style={{ background: `hsl(${hue} ${sat}% 53%)` }}
            />
            <span className="rounded-md px-3 py-1 text-xs font-medium text-white" style={{ background: `hsl(${hue} ${sat}% 53%)` }}>
              Button
            </span>
            <span className="font-mono text-xs" style={{ color: `hsl(${hue} ${sat}% 53%)` }}>
              Link
            </span>
          </div>
          {saved && (
            <span className="text-[10px] text-brand">Saved</span>
          )}
        </div>

        <button
          onClick={handleReset}
          className="mt-4 text-xs text-foreground-muted transition-colors hover:text-foreground"
        >
          Reset to default (Orange)
        </button>
      </section>
    </main>
  );
}
