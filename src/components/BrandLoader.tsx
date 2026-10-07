"use client";

import { useEffect } from "react";
import { applyBrandColor, loadBrandColor } from "@/lib/brand";

export default function BrandLoader() {
  useEffect(() => {
    const saved = loadBrandColor();
    if (saved) {
      applyBrandColor(saved.hue, saved.sat);
    }
  }, []);

  return null;
}
