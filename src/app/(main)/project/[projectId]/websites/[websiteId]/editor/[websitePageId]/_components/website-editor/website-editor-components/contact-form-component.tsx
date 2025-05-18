"use client";
import ContactForm from "@/components/forms/contact-form";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { EditorBtns } from "@/lib/constants";
import {
  getWebsite,
  saveActivityLogsNotification,
  upsertContact,
} from "@/lib/queries";

import { ContactUserFormSchema } from "@/lib/types";
import { EditorElement, useEditor } from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";

import React from "react";
import { z } from "zod";
import SortableElement from "../sortable-element";

type Props = {
  element: EditorElement;
  parentId: string;
  index: number;
  isExisting: boolean;
};

const ContactFormComponent = ({
  element,
  parentId,
  index,
  isExisting,
}: Props) => {
  const { dispatch, state, projectId, websiteId, pageDetails } = useEditor();
  const router = useRouter();

  const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
    if (type === null) return;
    e.dataTransfer.setData("componentType", type);
  };

  const handleOnClickBody = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: "CHANGE_CLICKED_ELEMENT",
      payload: {
        elementDetails: element,
      },
    });
  };

  const styles = element.styles;

  const goToNextPage = async () => {
    if (!state.editor.liveMode) return;
    const websitePages = await getWebsite(websiteId);
    if (!websitePages || !pageDetails) return;
    if (websitePages.WebsitePages.length > pageDetails.order + 1) {
      const nextPage = websitePages.WebsitePages.find(
        (page) => page.order === pageDetails.order + 1
      );
      if (!nextPage) return;
      router.replace(
        `${process.env.NEXT_PUBLIC_SCHEME}${websitePages.subDomainName}.${process.env.NEXT_PUBLIC_DOMAIN}/${nextPage.pathName}`
      );
    }
  };

  const handleDeleteElement = () => {
    dispatch({
      type: "DELETE_ELEMENT",
      payload: { elementDetails: element },
    });
  };

  const onFormSubmit = async (
    values: z.infer<typeof ContactUserFormSchema>
  ) => {
    if (!state.editor.liveMode) return;

    try {
      const response = await upsertContact({
        email: values.email,
        projectId: projectId,
        name: values.name,
        message: values.message,
      });
      //WIP Call trigger endpoint
      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `A New contact signed up | ${response?.name}`,
        projectId: projectId,
      });
      toast({
        title: "Success",
        description: "Successfully Saved your info",
      });
      await goToNextPage();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not save your information",
      });
    }
  };

  return (
    <SortableElement
      id={element.id}
      data={{ parentId, index, isExisting }}
      style={styles}
      onClick={handleOnClickBody}
      className={clsx(
        "p-[2px] w-full  relative text-[16px] transition-all flex items-center justify-center",
        {
          "!border-blue-500": state.editor.selectedElement.id === element.id,

          "!border-solid": state.editor.selectedElement.id === element.id,
          "border-dashed border-[1px] border-slate-300": !state.editor.liveMode,
        }
      )}>
      {state.editor.selectedElement.id === element.id &&
        !state.editor.liveMode && (
          <Badge className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg ">
            {state.editor.selectedElement.name}
          </Badge>
        )}
      <ContactForm
        title="Contact Us"
        subTitle="We would love to hear from you!"
        apiCall={onFormSubmit}
      />
      {state.editor.selectedElement.id === element.id &&
        !state.editor.liveMode && (
          <div className="absolute bg-primary px-2.5 py-1 text-xs font-bold  -top-[25px] -right-[1px] rounded-none rounded-t-lg !text-white">
            <Trash
              className="cursor-pointer"
              size={16}
              onClick={handleDeleteElement}
            />
          </div>
        )}
    </SortableElement>
  );
};

export default ContactFormComponent;
