"use client";

import React from "react";
import { useEditor } from "@/providers/editor/editor-provider";
import {
  DragDropContext,
  DropResult,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { EditorElement } from "@/providers/editor/editor-provider";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  BadgeDollarSign,
  Columns2,
  Contact,
  Link,
  Play,
  SquareDashed,
  Type,
} from "lucide-react";

type Props = {
  WebsitePageId: string;
};

export default function LayersTab({ WebsitePageId }: Props) {
  const { state, dispatch } = useEditor();

  // On drag end, reorder elements if needed
  const handleOnDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Use your existing reorder logic / action
    dispatch({
      type: "REORDER_ELEMENTS",
      payload: {
        source: {
          droppableId: source.droppableId,
          index: source.index,
        },
        destination: {
          droppableId: destination.droppableId,
          index: destination.index,
        },
        draggableId,
      },
    });
  };

  // This function only sets the editor's "selectedElement" on click
  const handleSelect = (el: EditorElement, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: "CHANGE_CLICKED_ELEMENT",
      payload: { elementDetails: el },
    });
  };

  // The body itself is not draggable. We just show it, allow selecting it,
  // and put a Droppable inside for its children
  const renderBody = (bodyElement: EditorElement) => {
    return (
      <div
        // highlight if selected
        style={{}}
        onClick={(e) => handleSelect(bodyElement, e)}
        className="cursor-pointer">
        {/* Show the body row (non-draggable) */}
        <div className="p-2 flex items-center gap-2">
          {getIcon(bodyElement.type)}
          <span className="text-sm font-semibold">{bodyElement.name}</span>
        </div>

        {/* Now we set the children in a Droppable so we can reorder them */}
        <Droppable droppableId="__body">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                paddingLeft: 8,
                marginLeft: 6,
                borderLeft: "1px dashed #ccc",
              }}>
              {Array.isArray(bodyElement.content) &&
                bodyElement.content.map((child, index) => {
                  return (
                    <Draggable
                      key={child.id}
                      draggableId={child.id}
                      index={index}>
                      {(draggableProvided) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...draggableProvided.dragHandleProps}
                          style={{
                            ...draggableProvided.draggableProps.style,
                          }}
                          onClick={(e) => handleSelect(child, e)}
                          className="cursor-pointer">
                          <div className="flex items-center gap-2 p-2">
                            {getIcon(child.type)}
                            <span className="text-xs">{child.name}</span>
                          </div>

                          {/* If this child has nested children, show them normally (non-draggable) */}
                          {Array.isArray(child.content) &&
                            child.content.length > 0 && (
                              <Accordion type="single" collapsible>
                                <AccordionItem
                                  value={child.id}
                                  className="border-0">
                                  <AccordionTrigger className="text-[11px] pl-0 py-1">
                                    Show children
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    {renderNested(child.content)}
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  // Nested items (children of children) are not draggable
  const renderNested = (elements: EditorElement[]) => {
    return (
      <div style={{ marginLeft: "1rem", borderLeft: "1px dashed #ccc" }}>
        {elements.map((el) => (
          <div
            key={el.id}
            onClick={(e) => handleSelect(el, e)}
            style={{}}
            className="cursor-pointer px-2 py-1">
            <div className="flex items-center gap-1">
              {getIcon(el.type)}
              <span className="text-xs">{el.name}</span>
            </div>
            {Array.isArray(el.content) && el.content.length > 0 && (
              <Accordion type="single" collapsible>
                <AccordionItem value={el.id} className="border-0">
                  <AccordionTrigger className="text-[10px] pl-0 py-1">
                    Show children
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderNested(el.content)}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4">
      <DragDropContext onDragEnd={handleOnDragEnd}>
        {/* 
          Since there should only be one __body, 
          we'll find that top-level body element in state.editor.elements.
          Typically your initial state has one element with id="__body".
        */}
        {state.editor.elements.map((el) => {
          if (el.id === "__body") {
            return (
              <React.Fragment key={el.id}>{renderBody(el)}</React.Fragment>
            );
          }
          // If you need to handle the possibility of other top-level
          // elements outside of __body, adapt accordingly.
          return null;
        })}
      </DragDropContext>
    </div>
  );
}

function getIcon(type: EditorElement["type"]) {
  switch (type) {
    case "__body":
    case "container":
      return <SquareDashed size={14} />;
    case "text":
      return <Type size={14} />;
    case "2Col":
      return <Columns2 size={14} />;
    case "video":
      return <Play size={14} />;
    case "contactForm":
      return <Contact size={14} />;
    case "paymentForm":
      return <BadgeDollarSign size={14} />;
    case "link":
      return <Link size={14} />;
    default:
      return <SquareDashed size={14} />;
  }
}
