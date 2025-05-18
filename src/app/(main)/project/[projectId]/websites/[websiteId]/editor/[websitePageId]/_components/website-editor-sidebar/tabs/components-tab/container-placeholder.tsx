"use client";
import ToolbarButton from "./ToolbarButton";

const ContainerPlaceholder = () => (
  <ToolbarButton id="container">
    <div className="h-full w-full flex gap-[4px] p-2 bg-muted/70 rounded-lg">
      <div className="border-dashed border-[1px] rounded-sm bg-muted border-muted-foreground/50 w-full" />
    </div>
  </ToolbarButton>
);

export default ContainerPlaceholder;
