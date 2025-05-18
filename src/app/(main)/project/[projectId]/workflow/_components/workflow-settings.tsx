"use client";
import React from "react";
import WorkflowInfobar from "./workflow-infobar";
import { Workflow } from "@prisma/client";
import CreateWorkflowForm from "@/components/forms/create-workflow-form";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteWorkflow } from "@/lib/queries";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const WorkflowSettings = ({
  workflowId,
  projectId,
  workflow,
}: {
  workflowId: string;
  projectId: string;
  workflow: Workflow[];
}) => {
  const router = useRouter();
  return (
    <AlertDialog>
      <div>
        <div className="flex items-center justify-between mb-4">
          <AlertDialogTrigger asChild>
            <Button variant={"destructive"}>Delete Workflow</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="items-center">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    await deleteWorkflow(workflowId);
                    //Challenge: Activity log
                    toast({
                      title: "Deleted",
                      description: "Workflow is deleted",
                    });
                    router.replace(`/project/${projectId}/workflow`);
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Oppse!",
                      description: "Could Delete Workflow",
                    });
                  }
                }}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </div>

        <CreateWorkflowForm
          projectId={projectId}
          defaultData={workflow.find((p) => p.id === workflowId)}
        />
      </div>
    </AlertDialog>
  );
};

export default WorkflowSettings;
