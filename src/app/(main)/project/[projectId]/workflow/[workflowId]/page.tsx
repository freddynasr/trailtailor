import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import {
  getLanesWithTaskAndTags,
  getWorkflowDetails,
  updateLanesOrder,
  updateTasksOrder,
} from "@/lib/queries";
import { LaneDetail } from "@/lib/types";
import { redirect } from "next/navigation";
import React from "react";
import WorkflowInfoBar from "../_components/workflow-infobar";
import WorkflowSettings from "../_components/workflow-settings";
import WorkflowView from "../_components/workflow-view";

type Props = {
  params: { projectId: string; workflowId: string };
};

const WorkflowPage = async ({ params }: Props) => {
  const workflowDetails = await getWorkflowDetails(params.workflowId);
  if (!workflowDetails)
    return redirect(`/project/${params.projectId}/workflow`);

  const workflow = await db.workflow.findMany({
    where: { projectId: params.projectId },
  });

  console.log(workflow);

  const lanes = (await getLanesWithTaskAndTags(
    params.workflowId
  )) as LaneDetail[];

  return (
    <Tabs defaultValue="view" className="w-full">
      <TabsList className="bg-transparent border-b-2 h-16 w-full justify-between mb-4">
        <WorkflowInfoBar
          workflowId={params.workflowId}
          projectId={params.projectId}
          workflow={workflow}
        />
        <div>
          <TabsTrigger value="view">Workflow View</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </div>
      </TabsList>
      <TabsContent value="view">
        <WorkflowView
          lanes={lanes}
          workflowDetails={workflowDetails}
          workflowId={params.workflowId}
          projectId={params.projectId}
          updateLanesOrder={updateLanesOrder}
          updateTasksOrder={updateTasksOrder}
        />
      </TabsContent>
      <TabsContent value="settings">
        <WorkflowSettings
          workflowId={params.workflowId}
          workflow={workflow}
          projectId={params.projectId}
        />
      </TabsContent>
    </Tabs>
  );
};

export default WorkflowPage;
