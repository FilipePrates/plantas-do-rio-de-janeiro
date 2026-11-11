import React from "react";
import { palette } from "../theme";
import type { DesktopGallerySizeProps } from "./DesktopGallerySize";

export function DesktopGallerySize({ value, columns, onChange }: DesktopGallerySizeProps) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 12, color: palette.muted,
      fontFamily: "system-ui, sans-serif", fontSize: 12, whiteSpace: "nowrap" }}>
      <span>Tamanho das fotos</span>
      <input type="range" min={88} max={240} step={8} value={value}
        aria-label="Tamanho das fotos" aria-valuetext={`${columns} fotos por linha`}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        style={{ width: 140, height: 24, margin: 0, accentColor: palette.pine, cursor: "pointer" }} />
      <span style={{ minWidth: 66, fontVariantNumeric: "tabular-nums", color: palette.pine }}>
        {columns} por linha
      </span>
    </label>
  );
}
