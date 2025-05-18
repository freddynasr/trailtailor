/* website-editor-components/recursive.tsx */
"use client";

import React from "react";
import type { EditorElement } from "@/providers/editor/editor-provider";
import SortableElement from "../sortable-element";

import TextComponent from "./text";
import Container from "./container";
import TwoColumns from "./two-columns";
import VideoComponent from "./video";
import LinkComponent from "./link-component";
import ContactFormComponent from "./contact-form-component";
import Checkout from "./checkout";

type Props = {
  element: EditorElement;
  parentId: string;
  index: number;
  isExisting: boolean;
};

const Recursive = (props: Props) => {
  const body = (() => {
    switch (props.element.type) {
      case "text":
        return <TextComponent {...props} />;
      case "link":
        return <LinkComponent {...props} />;
      case "video":
        return <VideoComponent {...props} />;
      case "contactForm":
        return <ContactFormComponent {...props} />;
      case "paymentForm":
        return <Checkout {...props} />;
      case "2Col":
        return <TwoColumns {...props} />;
      case "section":
      case "container":
      case "__body":
        return <Container {...props} />;
      default:
        return <Container {...props} />;
    }
  })();

  /*  Every node is still draggable / sortable */
  return body;
};

export default Recursive;
