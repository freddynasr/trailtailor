"use client";
import LaneForm from "@/components/forms/lane-form";
import CustomModal from "@/components/global/custom-modal";
import { Button } from "@/components/ui/button";
import {
  LaneDetail,
  WorkflowDetailsWithLanesCardsTagsTasks,
  TaskAndTags,
} from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { Lane, Task } from "@prisma/client";
import { Flag, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { DragDropContext, DropResult, Droppable } from "react-beautiful-dnd";
import WorkflowLane from "./workflow-lane";

type Props = {
  lanes: LaneDetail[];
  workflowId: string;
  projectId: string;
  workflowDetails: WorkflowDetailsWithLanesCardsTagsTasks;
  updateLanesOrder: (lanes: Lane[]) => Promise<void>;
  updateTasksOrder: (tasks: Task[]) => Promise<void>;
};

const WorkflowView = ({
  lanes,
  workflowDetails,
  workflowId,
  projectId,
  updateLanesOrder,
  updateTasksOrder,
}: Props) => {
  const { setOpen } = useModal();
  const router = useRouter();
  const [allLanes, setAllLanes] = useState<LaneDetail[]>([]);

  useEffect(() => {
    setAllLanes(lanes);
  }, [lanes]);

  const tasksFromAllLanes: TaskAndTags[] = [];
  lanes.forEach((item) => {
    item.Tasks.forEach((i) => {
      tasksFromAllLanes.push(i);
    });
  });
  const [allTasks, setAllTasks] = useState(tasksFromAllLanes);

  const handleAddLane = () => {
    setOpen(
      <CustomModal
        title=" Create A Lane"
        subheading="Lanes allow you to group tasks">
        <LaneForm workflowId={workflowId} />
      </CustomModal>
    );
  };

  const onDragEnd = (dropResult: DropResult) => {
    console.log(dropResult);
    const { destination, source, type } = dropResult;
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    switch (type) {
      case "lane": {
        const newLanes = [...allLanes]
          .toSpliced(source.index, 1)
          .toSpliced(destination.index, 0, allLanes[source.index])
          .map((lane, idx) => {
            return { ...lane, order: idx };
          });

        setAllLanes(newLanes);
        updateLanesOrder(newLanes);
      }

      case "task": {
        let newLanes = [...allLanes];
        const originLane = newLanes.find(
          (lane) => lane.id === source.droppableId
        );
        const destinationLane = newLanes.find(
          (lane) => lane.id === destination.droppableId
        );

        if (!originLane || !destinationLane) {
          return;
        }

        if (source.droppableId === destination.droppableId) {
          const newOrderedTasks = [...originLane.Tasks]
            .toSpliced(source.index, 1)
            .toSpliced(destination.index, 0, originLane.Tasks[source.index])
            .map((item, idx) => {
              return { ...item, order: idx };
            });
          originLane.Tasks = newOrderedTasks;
          setAllLanes(newLanes);
          updateTasksOrder(newOrderedTasks);
          router.refresh();
        } else {
          const [currentTask] = originLane.Tasks.splice(source.index, 1);

          originLane.Tasks.forEach((task, idx) => {
            task.order = idx;
          });

          destinationLane.Tasks.splice(destination.index, 0, {
            ...currentTask,
            laneId: destination.droppableId,
          });

          destinationLane.Tasks.forEach((task, idx) => {
            task.order = idx;
          });
          setAllLanes(newLanes);
          updateTasksOrder([...destinationLane.Tasks, ...originLane.Tasks]);
          router.refresh();
        }
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="bg-white/60 dark:bg-background/60 rounded-xl p-4 use-automation-zoom-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl">{workflowDetails?.name}</h1>
          <Button className="flex items-center gap-4" onClick={handleAddLane}>
            <Plus size={15} />
            Create Lane
          </Button>
        </div>
        <Droppable
          droppableId="lanes"
          type="lane"
          direction="horizontal"
          key="lanes">
          {(provided) => (
            <div
              className="flex item-center gap-x-2 overflow-scroll"
              {...provided.droppableProps}
              ref={provided.innerRef}>
              <div className="flex mt-4">
                {allLanes.map((lane, index) => (
                  <WorkflowLane
                    allTasks={allTasks}
                    setAllTasks={setAllTasks}
                    projectId={projectId}
                    workflowId={workflowId}
                    tasks={lane.Tasks}
                    laneDetails={lane}
                    index={index}
                    key={lane.id}
                  />
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
        {allLanes.length == 0 && (
          <div className="flex items-center justify-center w-full flex-col">
            <div className="opacity-100">
              <Flag
                width="100%"
                height="100%"
                className="text-muted-foreground"
              />
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default WorkflowView;
