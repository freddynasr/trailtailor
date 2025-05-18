import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: { projectId: string };
};

const Workflow = async ({ params }: Props) => {
  const workflowExists = await db.workflow.findFirst({
    where: { projectId: params.projectId },
  });

  if (workflowExists)
    return redirect(
      `/project/${params.projectId}/workflow/${workflowExists.id}`
    );

  try {
    const response = await db.workflow.create({
      data: { name: "First Workflow", projectId: params.projectId },
    });

    return redirect(`/project/${params.projectId}/workflow/${response.id}`);
  } catch (error) {
    console.log(error);
  }
};

export default Workflow;
