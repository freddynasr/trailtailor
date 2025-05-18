"use client";
import { getWorkflow } from "@/lib/queries";
import { Prisma } from "@prisma/client";
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import { Progress } from "../ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  projectId: string;
};

const WorkflowValue = ({ projectId }: Props) => {
  const [workflow, setWorkflow] = useState<
    Prisma.PromiseReturnType<typeof getWorkflow>
  >([]);

  const [selectedWorkflowId, setselectedWorkflowId] = useState("");
  const [workflowClosedValue, setWorkflowClosedValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getWorkflow(projectId);
      setWorkflow(res);
      setselectedWorkflowId(res[0]?.id);
    };
    fetchData();
  }, [projectId]);

  const totalWorkflowValue = useMemo(() => {
    if (workflow.length) {
      return (
        workflow
          .find((workflow) => workflow.id === selectedWorkflowId)
          ?.Lane?.reduce((totalLanes, lane, currentLaneIndex, array) => {
            const laneTasksTotal = lane.Tasks.reduce(
              (totalTasks, task) => totalTasks + Number(task?.value),
              0
            );
            if (currentLaneIndex === array.length - 1) {
              setWorkflowClosedValue(laneTasksTotal || 0);
              return totalLanes;
            }
            return totalLanes + laneTasksTotal;
          }, 0) || 0
      );
    }
    return 0;
  }, [selectedWorkflowId, workflow]);

  const workflowRate = useMemo(
    () =>
      (workflowClosedValue / (totalWorkflowValue + workflowClosedValue)) * 100,
    [workflowClosedValue, totalWorkflowValue]
  );

  return (
    <Card className="relative w-full xl:w-[350px]">
      <CardHeader>
        <CardDescription>Workflow Value</CardDescription>
        <small className="text-xs text-muted-foreground">
          Workflow Progress
        </small>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              Closed ${workflowClosedValue}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Total ${totalWorkflowValue + workflowClosedValue}
            </p>
          </div>
        </div>
        <Progress color="green" value={workflowRate} className="h-2" />
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p className="mb-2">
          Total value of all tasks in the given workflow except the last lane.
          Your last lane is considered your closing lane in every workflow.
        </p>
        <Select
          value={selectedWorkflowId}
          onValueChange={setselectedWorkflowId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a workflow" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Workflow</SelectLabel>
              {workflow.map((workflow) => (
                <SelectItem value={workflow.id} key={workflow.id}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default WorkflowValue;
