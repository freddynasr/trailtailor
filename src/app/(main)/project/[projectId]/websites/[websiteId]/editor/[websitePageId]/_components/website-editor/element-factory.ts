/* -------------------------------------------------
 *  element-factory.ts  – central template builder
 * ------------------------------------------------*/

import { v4 as uuid } from "uuid";
import { defaultStyles } from "@/lib/constants";
import type { EditorBtns } from "@/lib/constants";
import type { EditorElement } from "@/providers/editor/editor-provider";

/**
 * Returns a fully-formed EditorElement with a fresh id
 * for the requested component type.
 */
export default function buildElementTemplate(type: EditorBtns): EditorElement {
  switch (type) {
    /* ─────────── Simple leaves ─────────── */
    case "text":
      return {
        id: uuid(),
        name: "Text",
        type: "text",
        styles: { ...defaultStyles, color: "black" },
        content: { innerText: "Text Element" },
      };

    case "link":
      return {
        id: uuid(),
        name: "Link",
        type: "link",
        styles: { ...defaultStyles, color: "black" },
        content: { innerText: "Link Element", href: "#" },
      };

    case "video":
      return {
        id: uuid(),
        name: "Video",
        type: "video",
        styles: { width: "560px", height: "315px" },
        content: { src: "" },
      };

    /* ─────────── Container-like elements ─────────── */
    case "container":
      return {
        id: uuid(),
        name: "Container",
        type: "container",
        styles: { ...defaultStyles, width: "100%" },
        content: [], // empty children array
      };

    case "2Col":
      return {
        id: uuid(),
        name: "Two Columns",
        type: "2Col",
        styles: { ...defaultStyles, display: "flex" },
        content: [
          {
            id: uuid(),
            name: "Container",
            type: "container",
            styles: { ...defaultStyles, width: "100%" },
            content: [],
          },
          {
            id: uuid(),
            name: "Container",
            type: "container",
            styles: { ...defaultStyles, width: "100%" },
            content: [],
          },
        ],
      };

    /* ─────────── Forms / special widgets ─────────── */
    case "contactForm":
      return {
        id: uuid(),
        name: "Contact Form",
        type: "contactForm",
        styles: { ...defaultStyles, width: "100%" },
        content: [], // form renders itself; no children
      };

    case "paymentForm":
      return {
        id: uuid(),
        name: "Checkout",
        type: "paymentForm",
        styles: { ...defaultStyles, width: "100%" },
        content: [], // Stripe EmbeddedCheckout handles UI
      };

    /* ─────────── Unknown / fallback ─────────── */
    default:
      throw new Error(`Unknown template "${type}"`);
  }
}
