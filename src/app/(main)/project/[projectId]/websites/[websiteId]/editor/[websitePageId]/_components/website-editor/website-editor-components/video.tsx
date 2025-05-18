/* website-editor-components/video.tsx */
"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Trash, Pencil } from "lucide-react";
import { useEditor } from "@/providers/editor/editor-provider";

import type { EditorElement } from "@/providers/editor/editor-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = { element: EditorElement };

export default function VideoComponent({ element }: Props) {
  const { dispatch, state } = useEditor();
  const [editing, setEditing] = useState(false);
  const [tempSrc, setTempSrc] = useState(
    !Array.isArray(element.content) ? element.content.src || "" : ""
  );

  const { styles } = element;
  const isSelected = state.editor.selectedElement.id === element.id;
  const liveMode = state.editor.liveMode;

  /* ---------- Actions ---------- */
  const select = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: "CHANGE_CLICKED_ELEMENT",
      payload: { elementDetails: element },
    });
  };

  const remove = () =>
    dispatch({ type: "DELETE_ELEMENT", payload: { elementDetails: element } });

  const saveSrc = () => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: {
          ...element,
          content: { src: tempSrc },
        },
      },
    });
    setEditing(false);
  };

  /* ---------- Helpers ---------- */
  const renderVideo = () => {
    if (Array.isArray(element.content) || !element.content.src) return null;

    const src = element.content.src.trim();

    // YouTube
    if (/youtu\.?be/.test(src)) {
      const id = src.split(/v=|youtu\.be\//).pop();
      return (
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          width={styles.width || 560}
          height={styles.height || 315}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      );
    }

    // Vimeo
    if (/vimeo\.com/.test(src)) {
      const id = src.split("/").pop();
      return (
        <iframe
          src={`https://player.vimeo.com/video/${id}`}
          width={styles.width || 560}
          height={styles.height || 315}
          allow="autoplay; fullscreen; picture-in-picture"
        />
      );
    }

    // Plain <video>
    return (
      <video
        src={src}
        width={styles.width || 560}
        height={styles.height || 315}
        controls
      />
    );
  };

  /* ---------- Render ---------- */
  return (
    <div
      style={styles}
      onClick={select}
      className={clsx(
        "p-[4px] w-full relative flex items-center justify-center transition-all",
        {
          "!border-blue-500 !border-solid": isSelected,
          "border-dashed border-[1px] border-slate-300": !liveMode,
        }
      )}>
      {/* Label badge */}
      {isSelected && !liveMode && (
        <Badge className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg">
          {element.name}
        </Badge>
      )}

      {/* Main content */}
      {renderVideo() ||
        (!liveMode && (
          <div className="text-muted-foreground text-sm">
            <em>No video source — click pencil to add one.</em>
          </div>
        ))}

      {/* Delete & edit buttons (only in editor) */}
      {isSelected && !liveMode && (
        <div className="absolute flex gap-1 -top-[25px] -right-[1px]">
          <button
            className="bg-primary px-2 py-1 text-xs font-bold rounded-t-lg text-white"
            onClick={() => setEditing(true)}>
            <Pencil size={14} />
          </button>
          <button
            className="bg-primary px-2 py-1 text-xs font-bold rounded-t-lg text-white"
            onClick={remove}>
            <Trash size={14} />
          </button>
        </div>
      )}

      {/* Inline src editor */}
      {editing && !liveMode && (
        <div className="absolute z-50 bg-background border rounded shadow p-2 flex gap-2">
          <Input
            className=""
            autoFocus
            value={tempSrc}
            onChange={(e) => setTempSrc(e.target.value)}
            placeholder="Paste YouTube, Vimeo, or video URL"
          />
          <Button onClick={saveSrc}>Save</Button>
        </div>
      )}
    </div>
  );
}
