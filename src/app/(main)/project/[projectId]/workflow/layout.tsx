import BlurPage from "@/components/global/blur-page";
import React from "react";

const WorkflowLayout = ({ children }: { children: React.ReactNode }) => {
  return <BlurPage>{children}</BlurPage>;
};

export default WorkflowLayout;
