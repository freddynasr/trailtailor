"use client";

import React, { useEffect } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { EyeOff } from "lucide-react";

import SortableContainer from "./sortable-container";
import Recursive from "./website-editor-components/recursive";

import { getWebsitePageDetails } from "@/lib/queries";
import { useEditor } from "@/providers/editor/editor-provider";

/* -------------------------------------------------- */

type Props = { websitePageId: string; liveMode?: boolean };

const WebsiteEditor = ({ websitePageId, liveMode }: Props) => {
  /* ---------- Editor state & dispatcher ---------- */
  const { state, dispatch } = useEditor();

  /* ---------- Load page data once ---------- */
  useEffect(() => {
    (async () => {
      const page = await getWebsitePageDetails(websitePageId);
      if (!page) return;

      dispatch({
        type: "LOAD_DATA",
        payload: {
          elements: page.content ? JSON.parse(page.content) : "",
          withLive: !!liveMode,
        },
      });
    })();
  }, [websitePageId]);

  /* ---------- Apply liveMode prop on mount ---------- */
  useEffect(() => {
    if (liveMode) {
      dispatch({ type: "TOGGLE_LIVE_MODE", payload: { value: true } });
    }
  }, [liveMode]);

  /* ---------- Helpers ---------- */
  const handleCanvasClick = () =>
    dispatch({ type: "CHANGE_CLICKED_ELEMENT", payload: {} });

  const handleUnpreview = () => {
    dispatch({ type: "TOGGLE_PREVIEW_MODE" });
    dispatch({ type: "TOGGLE_LIVE_MODE" });
  };

  /* ---------- Render ---------- */
  return (
    <div
      className={clsx(
        "use-automation-zoom-in h-full mr-[385px] bg-background transition-all watevermark ",
        {
          "!p-0 !mr-0": state.editor.previewMode || state.editor.liveMode,
          "!w-[850px]": state.editor.device === "Tablet",
          "!w-[420px]": state.editor.device === "Mobile",
          "w-full": state.editor.device === "Desktop",
        }
      )}
      onClick={handleCanvasClick}>
      {/* Preview/LIVE exit button */}
      {state.editor.previewMode && state.editor.liveMode && (
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 bg-slate-600 p-[2px] fixed top-0 left-0 z-[100]"
          onClick={handleUnpreview}>
          <EyeOff />
        </Button>
      )}

      {/* Root sortable container – ids come from editor state */}
      {/* <SortableContainer
        id="sortable-container"
        disabled={state.editor.liveMode || state.editor.previewMode}
        ids={state.editor.elements.map((e) => e.id)}> */}
      {state.editor.elements.map((el, i) => (
        <Recursive
          key={el.id}
          element={el}
          parentId={el.id}
          index={i}
          isExisting
        />
      ))}
      {/* </SortableContainer> */}
    </div>
  );
};

export default WebsiteEditor;
