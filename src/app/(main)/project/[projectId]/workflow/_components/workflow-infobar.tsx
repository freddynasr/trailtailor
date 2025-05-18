"use client";
import CreateWorkflowForm from "@/components/forms/create-workflow-form";
import CustomModal from "@/components/global/custom-modal";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useModal } from "@/providers/modal-provider";
import { Workflow } from "@prisma/client";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  projectId: string;
  workflow: Workflow[];
  workflowId: string;
};

const WorkflowInfoBar = ({ workflow = [], workflowId, projectId }: Props) => {
  const { setOpen: setOpenModal, setClose } = useModal();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(workflowId);

  const handleClickCreateWorkflow = () => {
    setOpenModal(
      <CustomModal
        title="Create A Workflow"
        subheading="Workflow allows you to group tasks into lanes and track your business processes all in one place.">
        <CreateWorkflowForm projectId={projectId} />
      </CustomModal>
    );
  };

  return (
    <div>
      <div className="flex items-end gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between">
              {value
                ? workflow.find((wf) => wf.id === value)?.name
                : "Select a workflow..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandList>
                {Array.isArray(workflow) && workflow.length > 0 ? (
                  <CommandGroup>
                    {workflow.map((wf) => (
                      <Link
                        key={wf.id}
                        href={`/project/${projectId}/workflow/${wf.id}`}>
                        <CommandItem
                          key={wf.id}
                          value={wf.id}
                          onSelect={(currentValue) => {
                            setValue(currentValue);
                            setOpen(false);
                          }}>
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === wf.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {wf.name}
                        </CommandItem>
                      </Link>
                    ))}
                    <Button
                      variant="secondary"
                      className="flex gap-2 w-full mt-4"
                      onClick={handleClickCreateWorkflow}>
                      <Plus size={15} />
                      Create Workflow
                    </Button>
                  </CommandGroup>
                ) : (
                  <CommandEmpty>No workflow found.</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default WorkflowInfoBar;
