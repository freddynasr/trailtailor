"use client";
import ToolbarButton from "./ToolbarButton";

const TwoColumnsPlaceholder = () => (
  <ToolbarButton id="2Col">
    <div className="h-full w-full flex gap-[4px] p-2 bg-muted/70 rounded-lg">
      <div className="border-dashed border-[1px] rounded-sm bg-muted border-muted-foreground/50 w-full" />
      <div className="border-dashed border-[1px] rounded-sm bg-muted border-muted-foreground/50 w-full" />
    </div>
  </ToolbarButton>
);

export default TwoColumnsPlaceholder;
