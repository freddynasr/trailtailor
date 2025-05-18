"use client";

import CreateWebsitePage from "@/components/forms/website-page";
import CustomModal from "@/components/global/custom-modal";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { getWebsite, upsertWebsitePage } from "@/lib/queries";
import { WebsitesForProject } from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { WebsitePage } from "@prisma/client";
import { Check, ExternalLink, LucideEdit } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  DragStart,
  DropResult,
  Droppable,
} from "react-beautiful-dnd";
import Link from "next/link";
import WebsitePagePlaceholder from "@/components/icons/website-page-placeholder";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WebsiteStepCard from "./website-step-card";

type Props = {
  website: WebsitesForProject;
  projectId: string;
  pages: WebsitePage[];
  websiteId: string;
};

// Helper function to convert a string to a URL-friendly slug
function slugify(str: string) {
  return str.trim().toLowerCase().replace(/\s+/g, "-");
}

const WebsiteSteps = ({ website, websiteId, pages, projectId }: Props) => {
  const [clickedPage, setClickedPage] = useState<WebsitePage | undefined>(
    pages[0]
  );
  const { setOpen } = useModal();

  // Track the current state of pages to display
  const [pagesState, setPagesState] = useState(pages);

  // Keep a key to force Form re-render (to reset input fields)
  const [formKey, setFormKey] = useState(Date.now());

  // DragStart is optional, but included for debugging / selection
  const onDragStart = (event: DragStart) => {
    const { draggableId } = event;
    pagesState.find((page) => page.id === draggableId);
  };

  // Refresh the pages array in our UI
  const fetchPages = async () => {
    const updatedWebsite = await getWebsite(websiteId);
    if (updatedWebsite) {
      setPagesState(updatedWebsite.WebsitePages);
    }
    // Force a new key so the create form is reset
    setFormKey(Date.now());
  };

  // Reorder pages & update path logic
  const onDragEnd = async (dropResult: DropResult) => {
    const { destination, source } = dropResult;
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // 1) Reorder array
    const newPageOrder = [...pagesState]
      .toSpliced(source.index, 1)
      .toSpliced(destination.index, 0, pagesState[source.index]);

    // 2) Update each page’s order + pathName in the local array
    const updatedPageOrder = newPageOrder.map((page, idx) => {
      let updatedPath = page.pathName || "";
      if (idx === 0) {
        updatedPath = "";
      } else if (!updatedPath) {
        updatedPath = slugify(page.name);
      }
      return { ...page, order: idx, pathName: updatedPath };
    });

    // 3) Immediately update local state
    setPagesState(updatedPageOrder);

    // 4) Save changes to the database (order + path) using Promise.all
    try {
      await Promise.all(
        updatedPageOrder.map((page) =>
          upsertWebsitePage(
            projectId,
            {
              id: page.id,
              name: page.name,
              order: page.order,
              pathName: page.pathName,
            },
            websiteId
          )
        )
      );
      toast({
        title: "Success",
        description: "Saved page order",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not save page order",
      });
    }
  };

  return (
    <AlertDialog>
      <div className="flex border-[1px] lg:!flex-row flex-col">
        {/* Left panel: pages list */}
        <aside className="flex-[0.3] bg-background p-6 flex flex-col justify-between">
          <ScrollArea className="h-full">
            <div className="flex gap-4 items-center mb-2">
              <Check />
              Website Steps
            </div>
            {pagesState.length ? (
              <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
                <Droppable
                  droppableId="websites"
                  direction="vertical"
                  key="websites">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {pagesState.map((page, idx) => (
                        <div
                          className="relative"
                          key={page.id}
                          onClick={() => setClickedPage(page)}>
                          <WebsiteStepCard
                            websitePage={page}
                            index={idx}
                            activePage={page.id === clickedPage?.id}
                          />
                        </div>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No Pages
              </div>
            )}
          </ScrollArea>

          {/* Create new page button: triggers modal with fresh form key */}
          <Button
            className="mt-4 w-full"
            onClick={() => {
              setOpen(
                <CustomModal
                  title=" Create or Update a Website Page"
                  subheading="Website Pages allow you to create step-by-step processes for customers.">
                  <CreateWebsitePage
                    key={formKey} // Force form re-render
                    projectId={projectId}
                    websiteId={websiteId}
                    order={pagesState.length}
                    triggerReRender={fetchPages}
                  />
                </CustomModal>
              );
            }}>
            Create New Page
          </Button>
        </aside>

        {/* Right panel: selected page details */}
        <aside className="flex-[0.7] bg-muted p-4">
          {pagesState.length > 0 ? (
            <Card className="h-full flex justify-between flex-col">
              <CardHeader>
                <p className="text-sm text-muted-foreground">Page name</p>
                <CardTitle>{clickedPage?.name}</CardTitle>
                <CardDescription className="flex flex-col gap-4">
                  <div className="border-2 rounded-lg sm:w-80 w-full overflow-clip">
                    <Link
                      href={`/project/${projectId}/websites/${websiteId}/editor/${clickedPage?.id}`}
                      className="relative group">
                      <div className="cursor-pointer group-hover:opacity-30 w-full">
                        <WebsitePagePlaceholder />
                      </div>
                      <LucideEdit
                        size={50}
                        className="!text-muted-foreground absolute top-1/2 left-1/2 opacity-0 -translate-x-1/2 -translate-y-1/2 group-hover:opacity-100 transition-all duration-100"
                      />
                    </Link>

                    <Link
                      target="_blank"
                      href={`${process.env.NEXT_PUBLIC_SCHEME}${website.subDomainName}.${process.env.NEXT_PUBLIC_DOMAIN}/${clickedPage?.pathName}`}
                      className="group flex items-center justify-start p-2 gap-2 hover:text-primary transition-colors duration-200">
                      <ExternalLink size={15} />
                      <div className="w-64 overflow-hidden overflow-ellipsis">
                        {process.env.NEXT_PUBLIC_SCHEME}
                        {website.subDomainName}.{process.env.NEXT_PUBLIC_DOMAIN}
                        /{clickedPage?.pathName}
                      </div>
                    </Link>
                  </div>

                  {/* Edit existing page in place */}
                  <CreateWebsitePage
                    key={clickedPage?.id} // re-render form every time page changes
                    projectId={projectId}
                    defaultData={clickedPage}
                    websiteId={websiteId}
                    order={clickedPage?.order || 0}
                    triggerReRender={fetchPages}
                  />
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="h-[600px] flex items-center justify-center text-muted-foreground">
              Create a page to view its settings.
            </div>
          )}
        </aside>
      </div>
    </AlertDialog>
  );
};

export default WebsiteSteps;
