"use client";
import {
  deleteProject,
  getProjectDetails,
  saveActivityLogsNotification,
} from "@/lib/queries";
import { useRouter } from "next/navigation";
import React from "react";

type Props = {
  projectId: string;
};

const DeleteButton = ({ projectId }: Props) => {
  const router = useRouter();

  return (
    <div
      className="text-white"
      onClick={async () => {
        const response = await getProjectDetails(projectId);
        await saveActivityLogsNotification({
          agencyId: undefined,
          description: `Deleted a project | ${response?.name}`,
          projectId,
        });
        await deleteProject(projectId);
        router.refresh();
      }}>
      Delete Project
    </div>
  );
};

export default DeleteButton;
