"use client";
import { Link2Icon } from "lucide-react";
import ToolbarButton from "./ToolbarButton";

const LinkPlaceholder = () => (
  <ToolbarButton id="link">
    <Link2Icon size={40} className="text-muted-foreground" />
  </ToolbarButton>
);

export default LinkPlaceholder;
