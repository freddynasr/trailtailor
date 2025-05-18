/* src/website-editor-components/sortable-container.tsx */
"use client";

import React from "react";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  ids: string[]; // IDs of children
  id: string; // unique ID of this container
  children: React.ReactNode;
  className?: string; // optional className
  style?: React.CSSProperties; // optional style
  disabled?: boolean; // optional disabled prop
}

export default function SortableContainer({
  ids,
  id,
  children,
  className,
  style,
  disabled,
  ...rest
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  /* Optional visual feedback while an item is over the container */
  const overCls = isOver ? "container-over" : "";

  return (
    <SortableContext
      items={ids}
      strategy={rectSortingStrategy}
      disabled={disabled ?? false}>
      <div
        ref={setNodeRef}
        className={` ${className} ${overCls}`}
        style={style}
        {...rest}>
        {children}
      </div>
    </SortableContext>
  );
}
