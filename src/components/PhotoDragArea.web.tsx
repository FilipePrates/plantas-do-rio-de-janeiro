import React, { useRef, useState } from "react";
import type { PhotoDragAreaProps } from "./PhotoDragArea";

export function PhotoDragArea({ children, enabled, index, count, onChange }: PhotoDragAreaProps) {
  const start = useRef<{ x: number; y: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  const canDrag = enabled && count > 1;
  return (
    <div style={{ minWidth: 0, cursor: canDrag ? dragging ? "grabbing" : "grab" : undefined,
      userSelect: canDrag ? "none" : undefined }}
      onDragStart={(event) => { if (canDrag) event.preventDefault(); }}
      onPointerDownCapture={(event) => {
        suppressClick.current = false;
        if (!canDrag || event.pointerType !== "mouse" || event.button !== 0) return;
        start.current = { x: event.clientX, y: event.clientY, dragging: false };
      }}
      onPointerMoveCapture={(event) => {
        const gesture = start.current;
        if (!gesture) return;
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        if (!gesture.dragging && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
          gesture.dragging = true;
          suppressClick.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }
        if (gesture.dragging) { event.preventDefault(); event.stopPropagation(); }
      }}
      onPointerUpCapture={(event) => {
        const gesture = start.current;
        start.current = null;
        setDragging(false);
        if (!gesture?.dragging) return;
        event.preventDefault();
        event.stopPropagation();
        const dx = event.clientX - gesture.x;
        if (Math.abs(dx) >= 50) onChange(Math.max(0, Math.min(count - 1, index + (dx < 0 ? 1 : -1))));
      }}
      onLostPointerCapture={() => { start.current = null; setDragging(false); }}
      onPointerCancel={() => { start.current = null; setDragging(false); }}
      onClickCapture={(event) => {
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); }
      }}>
      {children}
    </div>
  );
}
