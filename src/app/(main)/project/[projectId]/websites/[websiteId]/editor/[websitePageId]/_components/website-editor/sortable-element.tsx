// src/website-editor-components/sortable-element.tsx
"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import clsx from "clsx";

type Props = {
  id: string;
  children: React.ReactNode;
  data?: Record<string, any>;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export default function SortableElement({
  id,
  data,
  children,
  className,
  style,
  onClick,
}: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id, data });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        {
          // "sortable-ghost": isDragging, // opacity helper
          "sortable-over container-over": isOver, // add second class
        },
        className
      )}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={onClick}
      {...attributes}
      {...listeners}>
      {children}
    </div>
  );
}
