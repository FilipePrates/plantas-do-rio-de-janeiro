import React from "react";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

import { palette } from "../theme";

export function BackIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M15 5L8 12l7 7"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </Svg>
  );
}

export function SettingsIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line
        x1="5"
        y1="7"
        x2="19"
        y2="7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle
        cx="9"
        cy="7"
        r="2.2"
        fill={palette.pine}
        stroke={color}
        strokeWidth={1.8}
      />
      <Line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle
        cx="15"
        cy="12"
        r="2.2"
        fill={palette.pine}
        stroke={color}
        strokeWidth={1.8}
      />
      <Line
        x1="5"
        y1="17"
        x2="19"
        y2="17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle
        cx="11"
        cy="17"
        r="2.2"
        fill={palette.pine}
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export function GridModeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect
        x="4.5"
        y="4.5"
        width="6.5"
        height="6.5"
        rx="1.4"
        fill="none"
        stroke={color}
        strokeWidth={1.9}
      />
      <Rect
        x="13"
        y="4.5"
        width="6.5"
        height="6.5"
        rx="1.4"
        fill="none"
        stroke={color}
        strokeWidth={1.9}
      />
      <Rect
        x="4.5"
        y="13"
        width="6.5"
        height="6.5"
        rx="1.4"
        fill="none"
        stroke={color}
        strokeWidth={1.9}
      />
      <Rect
        x="13"
        y="13"
        width="6.5"
        height="6.5"
        rx="1.4"
        fill="none"
        stroke={color}
        strokeWidth={1.9}
      />
    </Svg>
  );
}

export function ListModeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="6" cy="7" r="1.3" fill={color} />
      <Circle cx="6" cy="12" r="1.3" fill={color} />
      <Circle cx="6" cy="17" r="1.3" fill={color} />
      <Line
        x1="10"
        y1="7"
        x2="19"
        y2="7"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Line
        x1="10"
        y1="12"
        x2="19"
        y2="12"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Line
        x1="10"
        y1="17"
        x2="19"
        y2="17"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ListIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line
        x1="7"
        y1="7"
        x2="19"
        y2="7"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Line
        x1="7"
        y1="12"
        x2="19"
        y2="12"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Line
        x1="7"
        y1="17"
        x2="19"
        y2="17"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Circle cx="4.5" cy="7" r="1.2" fill={color} />
      <Circle cx="4.5" cy="12" r="1.2" fill={color} />
      <Circle cx="4.5" cy="17" r="1.2" fill={color} />
    </Svg>
  );
}

export function LeafIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M18.5 5.5c-5.8.1-10 2.4-12.2 6.3-1.3 2.2-1.6 4.4-1.7 6.7 2.3-.1 4.6-.4 6.8-1.7 3.8-2.3 6-6.4 6.1-11.3z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
      <Path
        d="M8 16c2-2.4 4.5-4.6 8-6.8"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export function BrandLeafIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 2C17 4.3 13.8 5.4 10 6.15C6.6 6.8 4.5 9.3 4.5 12.6C4.5 16.7 7.2 20 11 20C16.4 20 21 15.5 21 10C21 6.5 20.2 3.8 19 2Z"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

export function BookIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4.5 6.8c0-1 1-1.8 2.2-1.8H11v13H6.7c-1.2 0-2.2.8-2.2 1.8V6.8z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
      <Path
        d="M19.5 6.8c0-1-1-1.8-2.2-1.8H13v13h4.3c1.2 0 2.2.8 2.2 1.8V6.8z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.9}
      />
    </Svg>
  );
}
