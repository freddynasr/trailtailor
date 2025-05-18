/* app/(project)/editor/_components/EditorShellClient.tsx */
"use client";

import React from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";

import EditorProvider, {
  findElementById,
  useEditor,
} from "@/providers/editor/editor-provider";

import WebsiteEditorNavigation from "./website-editor-navigation";
import WebsiteEditorSidebar from "./website-editor-sidebar";
import WebsiteEditor from "./website-editor";

import type { WebsitePage } from "@prisma/client";
import type { EditorBtns } from "@/lib/constants";
import buildElementTemplate from "./website-editor/element-factory";

/* ─────────────────────────────────────────────── */
type Props = {
  projectId: string;
  websiteId: string;
  pageDetails: WebsitePage;
};

export default function EditorShellClient(props: Props) {
  /* 1️⃣ sensors shared by sidebar + canvas */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
  );

  /* 2️⃣ Context bridge so we can dispatch inside DndContext */
  function ContextBridge({ children }: { children: React.ReactNode }) {
    const { state, dispatch } = useEditor();

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
      /* 0. dropped outside any droppable → nothing to do */
      if (!over || active.id === over.id) return;

      const srcParent = active.data.current?.parentId as string;
      const srcIndex = active.data.current?.index as number;

      let dstParent = over.data.current?.parentId ?? (over.id as string);
      const dstIndex = over.data.current?.index ?? 0;

      /* 1. make sure the drop target exists (allow virtual root "__body") */
      if (!findElementById(state.editor.elements, dstParent)) {
        console.warn("[dnd-kit] Destination parent not found → drop ignored");
        dstParent = "__body";
      }

      /* 2. move existing element --------------------------------------- */
      if (active.data.current?.isExisting) {
        dispatch({
          type: "REORDER_ELEMENTS",
          payload: {
            draggableId: active.id as string,
            source: { droppableId: srcParent, index: srcIndex },
            destination: { droppableId: dstParent, index: dstIndex },
          },
        });
        return;
      }

      /* 3. add brand-new element from the toolbar ---------------------- */
      const template = buildElementTemplate(active.id as EditorBtns);
      dispatch({
        type: "ADD_ELEMENT",
        payload: {
          containerId: dstParent,
          elementDetails: template,
          index: dstIndex,
        },
      });
    };

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}>
        {children}
      </DndContext>
    );
  }

  /* 3️⃣ layout */
  return (
    <div className="fixed inset-0 z-20 bg-background overflow-hidden">
      <EditorProvider
        projectId={props.projectId}
        websiteId={props.websiteId}
        pageDetails={props.pageDetails}>
        <ContextBridge>
          <WebsiteEditorNavigation
            projectId={props.projectId}
            websiteId={props.websiteId}
            websitePageDetails={props.pageDetails}
          />

          <div className="h-full flex justify-center">
            <WebsiteEditor websitePageId={props.pageDetails.id} />
          </div>

          <WebsiteEditorSidebar
            projectId={props.projectId}
            WebsitePageId={props.pageDetails.id}
          />
        </ContextBridge>
      </EditorProvider>
    </div>
  );
}
