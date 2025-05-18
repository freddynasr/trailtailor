"use client";
import { EditorBtns } from "@/lib/constants";
import { EditorAction } from "./editor-actions";
import { Dispatch, createContext, useContext, useReducer } from "react";
import { WebsitePage } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export type DeviceTypes = "Desktop" | "Mobile" | "Tablet";

export type EditorElement = {
  id: string;
  styles: React.CSSProperties;
  name: string;
  type: EditorBtns;
  content:
    | EditorElement[]
    | { href?: string; innerText?: string; src?: string };
};

export type Editor = {
  liveMode: boolean;
  elements: EditorElement[];
  selectedElement: EditorElement;
  device: DeviceTypes;
  previewMode: boolean;
  websitePageId: string;
};

export type HistoryState = {
  history: Editor[];
  currentIndex: number;
};

export type EditorState = {
  editor: Editor;
  history: HistoryState;
};

const initialEditorState: EditorState["editor"] = {
  elements: [
    {
      content: [],
      id: "__body",
      name: "Body",
      styles: {},
      type: "__body",
    },
  ],
  selectedElement: {
    id: "",
    content: [],
    name: "",
    styles: {},
    type: null,
  },
  device: "Desktop",
  previewMode: false,
  liveMode: false,
  websitePageId: "",
};

const initialHistoryState: HistoryState = {
  history: [initialEditorState],
  currentIndex: 0,
};

const initialState: EditorState = {
  editor: initialEditorState,
  history: initialHistoryState,
};

const addAnElement = (
  tree: EditorElement[],
  action: EditorAction
): EditorElement[] => {
  if (action.type !== "ADD_ELEMENT") return tree;

  const { containerId, elementDetails, index } = action.payload;

  return tree.map((node) => {
    if (node.id === containerId && Array.isArray(node.content)) {
      const copy = [...node.content];
      copy.splice(index ?? copy.length, 0, elementDetails); // ← insert
      return { ...node, content: copy };
    }
    if (Array.isArray(node.content)) {
      return { ...node, content: addAnElement(node.content, action) };
    }
    return node;
  });
};

const updateAnElement = (
  editorArray: EditorElement[],
  action: EditorAction
): EditorElement[] => {
  if (action.type !== "UPDATE_ELEMENT") {
    throw Error("You sent the wrong action type to the update Element State");
  }
  return editorArray.map((item) => {
    if (item.id === action.payload.elementDetails.id) {
      return { ...item, ...action.payload.elementDetails };
    } else if (item.content && Array.isArray(item.content)) {
      return {
        ...item,
        content: updateAnElement(item.content, action),
      };
    }
    return item;
  });
};

const reorderElements = (
  elements: EditorElement[],
  draggableId: string,
  sourceDroppableId: string,
  sourceIndex: number,
  destinationDroppableId: string,
  destinationIndex: number
): EditorElement[] => {
  // 1. Remove the element from the source parent's content
  const [removedItem, newElements] = removeElement(
    elements,
    sourceDroppableId,
    draggableId
  );

  // 2. Insert that element in the destination parent's content
  const finalElements = insertElement(
    newElements,
    destinationDroppableId,
    removedItem,
    destinationIndex
  );

  return finalElements;
};

const removeElement = (
  elements: EditorElement[],
  parentId: string,
  childId: string
): [EditorElement | null, EditorElement[]] => {
  let removed: EditorElement | null = null;

  const updated = elements.map((el) => {
    if (el.id === parentId && Array.isArray(el.content)) {
      // remove from this parent's content
      const newContent = [...el.content];
      const indexToRemove = newContent.findIndex(
        (child) => child.id === childId
      );
      if (indexToRemove !== -1) {
        removed = newContent[indexToRemove];
        newContent.splice(indexToRemove, 1);
      }
      return {
        ...el,
        content: newContent,
      };
    } else if (Array.isArray(el.content) && el.content.length > 0) {
      // search deeper
      const [childRemoved, childUpdated] = removeElement(
        el.content,
        parentId,
        childId
      );
      if (childRemoved) {
        removed = childRemoved;
      }
      return {
        ...el,
        content: childUpdated,
      };
    }
    return el;
  });

  return [removed, updated];
};

// insertElement inserts `item` at `destinationIndex` inside parent droppable with id == `parentId`
const insertElement = (
  elements: EditorElement[],
  parentId: string,
  item: EditorElement | null,
  destinationIndex: number
): EditorElement[] => {
  if (!item) return elements;

  return elements.map((el) => {
    if (el.id === parentId && Array.isArray(el.content)) {
      // insert in parent's content
      const newContent = [...el.content];
      newContent.splice(destinationIndex, 0, item);
      return {
        ...el,
        content: newContent,
      };
    } else if (Array.isArray(el.content) && el.content.length > 0) {
      return {
        ...el,
        content: insertElement(el.content, parentId, item, destinationIndex),
      };
    }
    return el;
  });
};

function addAiElementNoImmer(
  elements: EditorElement[],
  containerId: string,
  elementDetails: EditorElement
): EditorElement[] {
  return elements.map((el) => {
    if (el.id === containerId && Array.isArray(el.content)) {
      return {
        ...el,
        content: [...el.content, elementDetails],
      };
    } else if (Array.isArray(el.content)) {
      // recurse
      return {
        ...el,
        content: addAiElementNoImmer(el.content, containerId, elementDetails),
      };
    }
    return el;
  });
}

const addAiElement = (
  editorArray: EditorElement[],
  containerId: string,
  elementDetails: EditorElement
): EditorElement[] => {
  return editorArray.map((item) => {
    if (item.id === containerId && Array.isArray(item.content)) {
      return {
        ...item,
        content: [...item.content, elementDetails],
      };
    } else if (item.content && Array.isArray(item.content)) {
      return {
        ...item,
        content: addAiElement(item.content, containerId, elementDetails),
      };
    }
    return item;
  });
};

const duplicateElementWithinEditor = (
  editorArray: EditorElement[],
  action: EditorAction
): EditorElement[] => {
  if (action.type !== "DUPLICATE_ELEMENT")
    throw Error("Invalid action type for duplicating element");

  const { elementId, newParentId } = action.payload;

  const elementToDuplicate = findElementById(editorArray, elementId);
  if (!elementToDuplicate) return editorArray;

  if (elementToDuplicate.id === "__body") {
    return editorArray;
  }

  const duplicatedChildren = Array.isArray(elementToDuplicate.content)
    ? elementToDuplicate.content.map(deepCopyElement)
    : elementToDuplicate.content || [];
  const duplicatedElement = {
    ...deepCopyElement(elementToDuplicate),
    content: duplicatedChildren,
  };

  return addElementToParent(editorArray, newParentId, duplicatedElement);
};

const addElementToParent = (
  elements: EditorElement[],
  parentId: string,
  newElement: EditorElement
): EditorElement[] => {
  return elements.map((el) => {
    if (el.id === parentId) {
      return {
        ...el,
        content: [...(Array.isArray(el.content) ? el.content : []), newElement],
      };
    }

    if (Array.isArray(el.content)) {
      return {
        ...el,
        content: addElementToParent(el.content, parentId, newElement),
      };
    }

    return el;
  });
};

export const findElementById = (
  elements: EditorElement[],
  id: string
): EditorElement | null => {
  for (const element of elements) {
    if (element.id === id) return element;
    if (Array.isArray(element.content)) {
      const found = findElementById(element.content, id);
      if (found) return found;
    }
  }
  return null;
};

const deepCopyElement = (element: EditorElement): EditorElement => {
  const newElement = { ...element, id: uuidv4() };

  if (Array.isArray(element.content)) {
    newElement.content = element.content.map(deepCopyElement);
  }

  return newElement;
};

const deleteAnElement = (
  editorArray: EditorElement[],
  action: EditorAction
): EditorElement[] => {
  if (action.type !== "DELETE_ELEMENT")
    throw Error(
      "You sent the wrong action type to the Delete Element editor State"
    );
  return editorArray.filter((item) => {
    if (item.id === action.payload.elementDetails.id) {
      return false;
    } else if (item.content && Array.isArray(item.content)) {
      item.content = deleteAnElement(item.content, action);
    }
    return true;
  });
};

const debugLog = (action: string, data: Record<string, unknown>) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Editor Debug] ${action}:`, data);
  }
};

const editorReducer = (
  state: EditorState = initialState,
  action: EditorAction
): EditorState => {
  switch (action.type) {
    case "ADD_ELEMENT":
      const updatedEditorState = {
        ...state.editor,
        elements: addAnElement(state.editor.elements, action),
      };

      const updatedHistory = [
        ...state.history.history.slice(0, state.history.currentIndex + 1),
        { ...updatedEditorState },
      ];

      const newEditorState = {
        ...state,
        editor: updatedEditorState,
        history: {
          ...state.history,
          history: updatedHistory,
          currentIndex: updatedHistory.length - 1,
        },
      };
      debugLog("ADD_ELEMENT result", { newEditorState });
      return newEditorState;

    case "ADD_FROM_AI": {
      const { containerId, elementDetails } = action.payload;
      // clone the element
      const clonedElement = deepCopyElement(elementDetails);

      const updatedElements = addAiElementNoImmer(
        state.editor.elements,
        containerId,
        clonedElement
      );

      const updatedEditorState = {
        ...state.editor,
        elements: updatedElements,
      };

      const updatedHistory = [
        ...state.history.history.slice(0, state.history.currentIndex + 1),
        updatedEditorState,
      ];

      const result = {
        ...state,
        editor: updatedEditorState,
        history: {
          ...state.history,
          history: updatedHistory,
          currentIndex: updatedHistory.length - 1,
        },
      };
      debugLog("ADD_FROM_AI result", { result });
      return result;
    }
    case "REORDER_ELEMENTS": {
      const { source, destination, draggableId } = action.payload;

      // In case user drags outside of a valid droppable or no movement
      if (!destination) return state;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return state; // no change
      }

      const reordered = reorderElements(
        state.editor.elements,
        draggableId,
        source.droppableId,
        source.index,
        destination.droppableId,
        destination.index
      );

      const newEditorState = {
        ...state.editor,
        elements: reordered,
      };

      const updatedHistory = [
        ...state.history.history.slice(0, state.history.currentIndex + 1),
        { ...newEditorState },
      ];

      const result = {
        ...state,
        editor: newEditorState,
        history: {
          ...state.history,
          history: updatedHistory,
          currentIndex: updatedHistory.length - 1,
        },
      };
      debugLog("REORDER_ELEMENTS result", { result });
      return result;
    }
    case "UPDATE_ELEMENT":
      const updatedElements = updateAnElement(state.editor.elements, action);

      const UpdatedElementIsSelected =
        state.editor.selectedElement.id === action.payload.elementDetails.id;

      const updatedEditorStateWithUpdate = {
        ...state.editor,
        elements: updatedElements,
        selectedElement: UpdatedElementIsSelected
          ? action.payload.elementDetails
          : {
              id: "",
              content: [],
              name: "",
              styles: {},
              type: null,
            },
      };

      const updatedHistoryWithUpdate = [
        ...state.history.history.slice(0, state.history.currentIndex + 1),
        { ...updatedEditorStateWithUpdate },
      ];
      const updatedEditor = {
        ...state,
        editor: updatedEditorStateWithUpdate,
        history: {
          ...state.history,
          history: updatedHistoryWithUpdate,
          currentIndex: updatedHistoryWithUpdate.length - 1,
        },
      };
      debugLog("UPDATE_ELEMENT result", { updatedEditor });
      return updatedEditor;

    case "DELETE_ELEMENT":
      const updatedElementsAfterDelete = deleteAnElement(
        state.editor.elements,
        action
      );
      const updatedEditorStateAfterDelete = {
        ...state.editor,
        elements: updatedElementsAfterDelete,
      };
      const updatedHistoryAfterDelete = [
        ...state.history.history.slice(0, state.history.currentIndex + 1),
        { ...updatedEditorStateAfterDelete },
      ];

      const deletedState = {
        ...state,
        editor: updatedEditorStateAfterDelete,
        history: {
          ...state.history,
          history: updatedHistoryAfterDelete,
          currentIndex: updatedHistoryAfterDelete.length - 1,
        },
      };
      debugLog("DELETE_ELEMENT result", { deletedState });
      return deletedState;

    case "CHANGE_CLICKED_ELEMENT":
      if (!action.payload) return state;
      if (
        action.payload.elementDetails?.id === state.editor.selectedElement.id
      ) {
        const result = {
          ...state,
          editor: {
            ...state.editor,
            selectedElement: {
              id: "",
              content: [],
              name: "",
              styles: {},
              type: null,
            },
          },
        };
        debugLog("CHANGE_CLICKED_ELEMENT result (deselect)", { result });
        return result;
      }
      const clickedState = {
        ...state,
        editor: {
          ...state.editor,
          selectedElement: action.payload.elementDetails || {
            id: "",
            content: [],
            name: "",
            styles: {},
            type: null,
          },
        },
        history: {
          ...state.history,
          history: [
            ...state.history.history.slice(0, state.history.currentIndex + 1),
            { ...state.editor },
          ],
          currentIndex: state.history.currentIndex + 1,
        },
      };
      debugLog("CHANGE_CLICKED_ELEMENT result (select)", { clickedState });
      return clickedState;
    case "CHANGE_DEVICE":
      const changedDeviceState = {
        ...state,
        editor: {
          ...state.editor,
          device: action.payload.device,
        },
      };
      debugLog("CHANGE_DEVICE result", { changedDeviceState });
      return changedDeviceState;

    case "TOGGLE_PREVIEW_MODE":
      const toggleState = {
        ...state,
        editor: {
          ...state.editor,
          previewMode: !state.editor.previewMode,
        },
      };
      debugLog("TOGGLE_PREVIEW_MODE result", { toggleState });
      return toggleState;

    case "TOGGLE_LIVE_MODE":
      const toggleLiveMode: EditorState = {
        ...state,
        editor: {
          ...state.editor,
          liveMode: action.payload
            ? action.payload.value
            : !state.editor.liveMode,
        },
      };
      debugLog("TOGGLE_LIVE_MODE result", { toggleLiveMode });
      return toggleLiveMode;

    case "REDO":
      if (state.history.currentIndex < state.history.history.length - 1) {
        const nextIndex = state.history.currentIndex + 1;
        const nextEditorState = { ...state.history.history[nextIndex] };
        const redoState = {
          ...state,
          editor: nextEditorState,
          history: {
            ...state.history,
            currentIndex: nextIndex,
          },
        };
        debugLog("REDO result", { redoState });
        return redoState;
      }
      return state;

    case "UNDO":
      if (state.history.currentIndex > 0) {
        const prevIndex = state.history.currentIndex - 1;
        const prevEditorState = { ...state.history.history[prevIndex] };
        const undoState = {
          ...state,
          editor: prevEditorState,
          history: {
            ...state.history,
            currentIndex: prevIndex,
          },
        };
        debugLog("UNDO result", { undoState });
        return undoState;
      }
      return state;

    case "LOAD_DATA":
      const loadDataResult = {
        ...initialState,
        editor: {
          ...initialState.editor,
          elements: action.payload.elements || initialEditorState.elements,
          liveMode: !!action.payload.withLive,
        },
      };
      debugLog("LOAD_DATA result", { loadDataResult });
      return loadDataResult;

    case "SET_WEBSITEPAGE_ID":
      const { websitePageId } = action.payload;
      const updatedEditorStateWithWebsitePageId = {
        ...state.editor,
        websitePageId,
      };

      const updatedHistoryWithWebsitePageId = [
        ...state.history.history.slice(0, state.history.currentIndex + 1),
        { ...updatedEditorStateWithWebsitePageId },
      ];

      const websitePageIdState = {
        ...state,
        editor: updatedEditorStateWithWebsitePageId,
        history: {
          ...state.history,
          history: updatedHistoryWithWebsitePageId,
          currentIndex: updatedHistoryWithWebsitePageId.length - 1,
        },
      };
      debugLog("SET_WEBSITEPAGE_ID result", { websitePageIdState });
      return websitePageIdState;

    case "DUPLICATE_ELEMENT":
      const duplicateResult = {
        ...state,
        editor: {
          ...state.editor,
          elements: duplicateElementWithinEditor(state.editor.elements, action),
        },
        history: {
          ...state.history,
          history: [
            ...state.history.history.slice(0, state.history.currentIndex + 1),
            { ...state.editor },
          ],
          currentIndex: state.history.currentIndex + 1,
        },
      };
      debugLog("DUPLICATE_ELEMENT result", { duplicateResult });
      return duplicateResult;

    default:
      return state;
  }
};

export type EditorContextData = {
  device: DeviceTypes;
  previewMode: boolean;
  setPreviewMode: (previewMode: boolean) => void;
  setDevice: (device: DeviceTypes) => void;
};

export const EditorContext = createContext<{
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  projectId: string;
  websiteId: string;
  pageDetails: WebsitePage | null;
}>({
  state: initialState,
  dispatch: () => undefined,
  projectId: "",
  websiteId: "",
  pageDetails: null,
});

type EditorProps = {
  children: React.ReactNode;
  projectId: string;
  websiteId: string;
  pageDetails: WebsitePage;
};

const EditorProvider = (props: EditorProps) => {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return (
    <EditorContext.Provider
      value={{
        state,
        dispatch,
        projectId: props.projectId,
        websiteId: props.websiteId,
        pageDetails: props.pageDetails,
      }}>
      {props.children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor Hook must be used within the editor Provider");
  }
  return context;
};

export default EditorProvider;
