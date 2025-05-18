"use client";
import { TypeIcon } from "lucide-react";
import ToolbarButton from "./ToolbarButton";

const TextPlaceholder = () => (
  <ToolbarButton id="text">
    <TypeIcon size={40} className="text-muted-foreground" />
  </ToolbarButton>
);

export default TextPlaceholder;
