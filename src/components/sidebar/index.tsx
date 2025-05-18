import { getAuthUserDetails } from "@/lib/queries";
import { off } from "process";
import React from "react";
import MenuOptions from "./menu-options";

type Props = {
  id: string;
  type: "agency" | "project";
};

const Sidebar = async ({ id, type }: Props) => {
  const user = await getAuthUserDetails();
  if (!user) return null;

  if (!user.Agency) return;

  const details =
    type === "agency"
      ? user?.Agency
      : user?.Agency.Project.find((project) => project.id === id);

  const isWhiteLabeledAgency = user.Agency.whiteLabel;
  if (!details) return;

  let sideBarLogo = user.Agency.agencyLogo || "/assets/trailtailor-logo.svg";

  if (!isWhiteLabeledAgency) {
    if (type === "project") {
      sideBarLogo =
        user?.Agency.Project.find((project) => project.id === id)
          ?.projectLogo || user.Agency.agencyLogo;
    }
  }

  const sidebarOpt =
    type === "agency"
      ? user.Agency.SidebarOption || []
      : user.Agency.Project.find((project) => project.id === id)
          ?.SidebarOption || [];

  const projects = user.Agency.Project.filter((project) =>
    user.Permissions.find(
      (permission) => permission.projectId === project.id && permission.access
    )
  );

  return (
    <>
      <MenuOptions
        defaultOpen={true}
        details={details}
        id={id}
        sidebarLogo={sideBarLogo}
        sidebarOpt={sidebarOpt}
        projects={projects}
        user={user}
      />
      <MenuOptions
        details={details}
        id={id}
        sidebarLogo={sideBarLogo}
        sidebarOpt={sidebarOpt}
        projects={projects}
        user={user}
      />
    </>
  );
};

export default Sidebar;
