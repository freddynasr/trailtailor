/* website-editor-components/two-columns.tsx */
"use client";

import React from "react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash } from "lucide-react";
import { useEditor } from "@/providers/editor/editor-provider";
import SortableContainer from "../sortable-container";
import Recursive from "./recursive";
import { useModal } from "@/providers/modal-provider";
import CustomModal from "@/components/global/custom-modal";
import Aiprompt from "@/components/ai/ai-prompt";
import type { EditorElement } from "@/providers/editor/editor-provider";
import SortableElement from "../sortable-element";

type Props = {
  element: EditorElement;
  parentId: string;
  index: number;
  isExisting: boolean;
};

const TwoColumns = ({ element, parentId, index, isExisting }: Props) => {
  const { id, content, styles, name } = element;
  const { state, dispatch } = useEditor();
  const { setOpen } = useModal();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: "CHANGE_CLICKED_ELEMENT",
      payload: { elementDetails: element },
    });
  };

  const handleDelete = () => {
    dispatch({
      type: "DELETE_ELEMENT",
      payload: { elementDetails: element },
    });
  };

  const handleAddComponent = (parsed: EditorElement) => {
    dispatch({
      type: "ADD_FROM_AI",
      payload: { containerId: id, elementDetails: parsed },
    });
  };

  return (
    <SortableContainer
      disabled={state.editor.liveMode || state.editor.previewMode}
      id={id}
      ids={Array.isArray(content) ? content.map((c) => c.id) : []}>
      <SortableElement
        id={id}
        data={{ parentId, index, isExisting }}
        onClick={handleClick}
        style={styles}
        className={clsx(
          "relative p-4 transition-all flex flex-col md:flex-row",
          {
            "border-dashed border-[1px] border-slate-300":
              !state.editor.liveMode,
            "!border-blue-500 !border-solid":
              state.editor.selectedElement.id === id && !state.editor.liveMode,
          }
        )}>
        {/* --- name badge --- */}
        {state.editor.selectedElement.id === id && !state.editor.liveMode && (
          <Badge
            className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg"
            onClick={(e) => e.stopPropagation()}>
            <span>{name}</span>
          </Badge>
        )}

        {/* --- AI badge --- */}
        {state.editor.selectedElement.id === id && !state.editor.liveMode && (
          <Badge
            className="absolute -top-[23px] left-[80px] rounded-none rounded-t-lg"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(
                <CustomModal title="AI Prompt" subheading="Enter a prompt">
                  <Aiprompt
                    containerId={id}
                    handleAddComponent={handleAddComponent}
                  />
                </CustomModal>
              );
            }}>
            <Sparkles size={16} />
          </Badge>
        )}

        {/* --- children --- */}
        {Array.isArray(content) &&
          content.map((child, i) => (
            <Recursive
              key={child.id}
              element={child}
              parentId={id}
              index={i}
              isExisting
            />
          ))}

        {/* --- delete button --- */}
        {state.editor.selectedElement.id === id && !state.editor.liveMode && (
          <div className="absolute bg-primary px-2.5 py-1 text-xs font-bold -top-[25px] -right-[1px] rounded-none rounded-t-lg">
            <Trash size={16} onClick={handleDelete} />
          </div>
        )}
      </SortableElement>
    </SortableContainer>
  );
};

export default TwoColumns;
