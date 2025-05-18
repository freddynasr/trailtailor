"use client";
import { Youtube } from "lucide-react";
import ToolbarButton from "./ToolbarButton";

const VideoPlaceholder = () => (
  <ToolbarButton id="video">
    <Youtube size={40} className="text-muted-foreground" />
  </ToolbarButton>
);

export default VideoPlaceholder;
