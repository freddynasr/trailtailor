"use client";

import { useDraggable } from "@dnd-kit/core";
import clsx from "clsx";
import type { EditorBtns } from "@/lib/constants";

type Props = {
  id: EditorBtns; // the component “type” you’ll drop into the canvas
  children: React.ReactNode;
};

/**
 * Generic drag source for the sidebar.
 * It tells the canvas “this is a *new* element (isExisting = false)”.
 */
export default function ToolbarButton({ id, children }: Props) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: id ?? "container", // the component “type” you’ll drop into the canvas
    data: { isExisting: false, parentId: null, index: null },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      className={clsx(
        "h-14 w-14 rounded-lg bg-muted flex items-center justify-center",
        "cursor-grab active:cursor-grabbing select-none",
        { "opacity-40": isDragging }
      )}>
      {children}
    </div>
  );
}
