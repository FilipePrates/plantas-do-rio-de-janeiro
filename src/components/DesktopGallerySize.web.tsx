import React from "react";
import { palette } from "../theme";
import type { DesktopGallerySizeProps } from "./DesktopGallerySize";

export function DesktopGallerySize({ value, columns, onChange }: DesktopGallerySizeProps) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 12, color: palette.muted,
      fontFamily: "system-ui, sans-serif", fontSize: 12, whiteSpace: "nowrap" }}>
      <span style={{ minWidth: 66, fontVariantNumeric: "tabular-nums", color: palette.pine }}>
        {columns} por linha
      </span>
      <input type="range" min={6} max={22} step={1} value={value}
        aria-label="Fotos por linha" aria-valuetext={`${columns} fotos por linha`}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        style={{ width: 140, height: 24, margin: 0, accentColor: palette.pine, cursor: "pointer" }} />
    </label>
  );
}
