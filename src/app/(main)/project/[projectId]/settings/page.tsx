import ProjectDetails from "@/components/forms/project-details";
import UserDetails from "@/components/forms/user-details";
import BlurPage from "@/components/global/blur-page";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import React from "react";

type Props = {
  params: { projectId: string };
};

const ProjectSettingPage = async ({ params }: Props) => {
  const authUser = await currentUser();
  if (!authUser) return;
  const userDetails = await db.user.findUnique({
    where: {
      email: authUser.emailAddresses[0].emailAddress,
    },
  });
  if (!userDetails) return;

  const project = await db.project.findUnique({
    where: { id: params.projectId },
  });
  if (!project) return;

  const agencyDetails = await db.agency.findUnique({
    where: { id: project.agencyId },
    include: { Project: true },
  });

  if (!agencyDetails) return;
  const projects = agencyDetails.Project;

  return (
    <BlurPage>
      <div className="flex lg:!flex-row flex-col gap-4">
        <ProjectDetails
          agencyDetails={agencyDetails}
          details={project}
          userId={userDetails.id}
          userName={userDetails.name}
        />
        <UserDetails
          type="project"
          id={params.projectId}
          projects={projects}
          userData={userDetails}
        />
      </div>
    </BlurPage>
  );
};

export default ProjectSettingPage;
