"use client";
import ProjectDetails from "@/components/forms/project-details";
import CustomModal from "@/components/global/custom-modal";
import { Button } from "@/components/ui/button";
import { useModal } from "@/providers/modal-provider";
import { Agency, AgencySidebarOption, Project, User } from "@prisma/client";
import { PlusCircleIcon } from "lucide-react";
import React from "react";
import { twMerge } from "tailwind-merge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { pricingCards } from "@/lib/constants";

type Props = {
  user: User & {
    Agency:
      | (Agency & {
          Project: Project[];
          SidebarOption: AgencySidebarOption[];
          Subscription?: {
            active: boolean;
          } | null;
        })
      | null;
  };
  id: string;
  className: string;
};

const CreateProjectButton = ({ className, id, user }: Props) => {
  console.log(user);
  const { setOpen } = useModal();
  const agencyDetails = user.Agency;

  if (!agencyDetails) return;

  const hasSubscription = agencyDetails.Subscription?.active;
  const projectCount = agencyDetails.Project?.length || 0;
  const isDisabled = !hasSubscription && projectCount >= 3;

  const handleClick = () => {
    if (isDisabled) return;

    setOpen(
      <CustomModal
        title="Create a Project"
        subheading="You can switch bettween">
        <ProjectDetails
          agencyDetails={agencyDetails}
          userId={user.id}
          userName={user.name}
        />
      </CustomModal>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={twMerge("w-full flex gap-4", className)}
            onClick={handleClick}
            disabled={isDisabled}>
            <PlusCircleIcon size={15} />
            Create Project
          </Button>
        </TooltipTrigger>
        {isDisabled && (
          <TooltipContent>
            <p>Upgrade to Premium plan to create more projects</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default CreateProjectButton;
