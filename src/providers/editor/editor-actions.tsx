import { DeviceTypes, EditorElement } from "./editor-provider";

export type EditorAction =
  | {
      type: "REORDER_ELEMENTS";
      payload: {
        source: {
          droppableId: string;
          index: number;
        };
        destination: {
          droppableId: string;
          index: number;
        };
        draggableId: string;
      };
    }
  | {
      type: "ADD_ELEMENT";
      payload: {
        containerId: string;
        elementDetails: EditorElement;
        index?: number;
      };
    }
  | {
      type: "UPDATE_ELEMENT";
      payload: {
        elementDetails: EditorElement;
      };
    }
  | {
      type: "DELETE_ELEMENT";
      payload: {
        elementDetails: EditorElement;
      };
    }
  | {
      type: "CHANGE_CLICKED_ELEMENT";
      payload: {
        elementDetails?:
          | EditorElement
          | {
              id: "";
              content: [];
              name: "";
              styles: {};
              type: null;
            };
      };
    }
  | {
      type: "CHANGE_DEVICE";
      payload: {
        device: DeviceTypes;
      };
    }
  | {
      type: "TOGGLE_PREVIEW_MODE";
    }
  | {
      type: "TOGGLE_LIVE_MODE";
      payload?: {
        value: boolean;
      };
    }
  | {
      type: "ADD_FROM_AI";
      payload: {
        containerId: string;
        elementDetails: EditorElement;
      };
    }
  | { type: "REDO" }
  | { type: "UNDO" }
  | {
      type: "LOAD_DATA";
      payload: {
        elements: EditorElement[];
        withLive: boolean;
      };
    }
  | {
      type: "SET_WEBSITEPAGE_ID";
      payload: {
        websitePageId: string;
      };
    }
  | {
      type: "DUPLICATE_ELEMENT";
      payload: {
        elementId: string;
        newParentId: string;
      };
    };
