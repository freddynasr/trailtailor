/* ----------------------------------------------
 *  app/(project)/editor/_components/WebsiteEditorNavigation.tsx
 * -------------------------------------------- */

"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
/* ⬇ import the event-emitter from the legacy router solely for route events */
import Router from "next/router";

import {
  ArrowLeftCircle,
  CheckCircle,
  EyeIcon,
  Laptop,
  Redo2,
  Smartphone,
  Tablet,
  Undo2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { upsertWebsitePage } from "@/lib/queries";
import { DeviceTypes, useEditor } from "@/providers/editor/editor-provider";

import { WebsitePage } from "@prisma/client";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

/* ─────────────────────────────────────────────── */
type Props = {
  websiteId: string;
  websitePageDetails: WebsitePage;
  projectId: string;
};

export default function WebsiteEditorNavigation({
  websiteId,
  websitePageDetails,
  projectId,
}: Props) {
  const router = useRouter();
  const { state, dispatch } = useEditor();

  const [autoSave, setAutoSave] = useState<boolean>(() => {
    return localStorage.getItem("autoSave") === "true";
  });
  const [saved, setSaved] = useState<boolean>(true);

  /* keep page id in global editor */
  useEffect(() => {
    dispatch({
      type: "SET_WEBSITEPAGE_ID",
      payload: { websitePageId: websitePageDetails.id },
    });
  }, [websitePageDetails, dispatch]);

  /* ───────────────────────────────────────────────
   *  confirm-leave guard for *all* navigation types
   * ───────────────────────────────────────────────*/
  useEffect(() => {
    /* 1️⃣ client-side route changes (Next.js links, router.back, etc.) */
    const handleRouteChangeStart = () => {
      if (
        !saved &&
        !window.confirm("You have unsaved changes. Leave anyway?")
      ) {
        /* Cancel the navigation */
        Router.events.emit("routeChangeError");
        // Throwing an error aborts the transition without logging noise
        throw "Route change aborted (unsaved changes)";
      }
    };
    Router.events.on("routeChangeStart", handleRouteChangeStart);

    /* 2️⃣ browser refresh / close */
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!saved) {
        event.preventDefault();
        event.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    /* 3️⃣ native Back / Forward hardware buttons */
    const handlePopState = () => {
      if (
        !saved &&
        !window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        )
      ) {
        // Re-push current URL to keep user on the page
        router.push(window.location.pathname);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      Router.events.off("routeChangeStart", handleRouteChangeStart);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [saved, router]);

  /* ───────────────────────────────────────────────
   *  auto-save + dirty-state tracking
   * ───────────────────────────────────────────────*/
  useEffect(() => {
    setSaved(false);
    if (autoSave) debouncedSave();
  }, [state.editor.elements]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleAutoSave = async (checked: boolean) => {
    setAutoSave(checked);
    localStorage.setItem("autoSave", checked.toString());

    if (checked) {
      toast("Auto-Save Enabled", {
        description: "Your changes will be auto-saved every 2.5 s.",
      });
      await handleOnSave();
    } else {
      toast("Auto-Save Disabled", {
        description: "Your changes will not be auto-saved.",
      });
    }
  };

  /* manual save */
  const handleOnSave = async () => {
    const content = JSON.stringify(state.editor.elements);
    try {
      await upsertWebsitePage(
        projectId,
        { ...websitePageDetails, content },
        websiteId,
        { silent: true }
      );
      setSaved(true);
      toast("Success", { description: "Saved editor" });
    } catch {
      toast("Oops!", { description: "Could not save editor" });
    }
  };

  /* debounced auto-save */
  const debouncedSave = useDebouncedCallback(async () => {
    const content = JSON.stringify(state.editor.elements);
    try {
      await upsertWebsitePage(
        projectId,
        { ...websitePageDetails, content },
        websiteId,
        { silent: true }
      );
      setSaved(true);
    } catch (e) {
      console.error("Auto-save failed", e);
    }
  }, 1000);

  /* ───────────────────────────────────────────────
   *  render
   * ───────────────────────────────────────────────*/
  return (
    <TooltipProvider>
      <nav
        className={clsx(
          "border-b flex items-center justify-between p-6 gap-2 transition-all",
          { "!h-0 !p-0 !overflow-hidden": state.editor.previewMode }
        )}>
        {/* ◇ Left : Back link + page name + path */}
        <aside className="flex items-center gap-4 max-w-[260px] w-[300px]">
          <Link href={`/project/${projectId}/websites/${websiteId}`}>
            <ArrowLeftCircle />
          </Link>

          <div className="flex flex-col w-full">
            <Input
              defaultValue={websitePageDetails.name}
              className="border-none h-5 m-0 p-0 text-lg"
              onBlur={handleOnSave}
            />
            <span className="text-sm text-muted-foreground">
              Path: /{websitePageDetails.pathName}
            </span>
          </div>
        </aside>

        {/* ◇ Center : Device selector */}
        <Tabs
          value={state.editor.device}
          onValueChange={(value) =>
            dispatch({
              type: "CHANGE_DEVICE",
              payload: { device: value as DeviceTypes },
            })
          }>
          <TabsList className="grid grid-cols-3 bg-transparent">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="Desktop"
                  className="w-10 h-10 p-0 data-[state=active]:bg-muted">
                  <Laptop />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Desktop</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="Tablet"
                  className="w-10 h-10 p-0 data-[state=active]:bg-muted">
                  <Tablet />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Tablet</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="Mobile"
                  className="w-10 h-10 p-0 data-[state=active]:bg-muted">
                  <Smartphone />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Mobile</TooltipContent>
            </Tooltip>
          </TabsList>
        </Tabs>

        {/* ◇ Right : save state, autosave, preview, undo/redo, manual save */}
        <aside className="flex items-center gap-2">
          {/* save indicator */}
          <div className="flex items-center gap-2 text-sm">
            {saved ? (
              <span className="text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Saved
              </span>
            ) : (
              <span className="text-red-600 flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                Unsaved Changes
              </span>
            )}
          </div>

          {/* auto-save toggle */}
          <div className="flex items-center gap-2 mr-4">
            <span className="text-muted-foreground">Auto-Save</span>
            <Switch checked={autoSave} onCheckedChange={handleToggleAutoSave} />
          </div>

          {/* preview toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-800"
            onClick={() => {
              dispatch({ type: "TOGGLE_PREVIEW_MODE" });
              dispatch({ type: "TOGGLE_LIVE_MODE" });
            }}>
            <EyeIcon />
          </Button>

          {/* undo / redo */}
          <Button
            disabled={state.history.currentIndex <= 0}
            onClick={() => dispatch({ type: "UNDO" })}
            variant="ghost"
            size="icon"
            className="hover:bg-slate-800">
            <Undo2 />
          </Button>
          <Button
            disabled={
              state.history.currentIndex >= state.history.history.length - 1
            }
            onClick={() => dispatch({ type: "REDO" })}
            variant="ghost"
            size="icon"
            className="hover:bg-slate-800 mr-4">
            <Redo2 />
          </Button>

          {/* manual save */}
          <Button onClick={handleOnSave}>Save</Button>
        </aside>
      </nav>
    </TooltipProvider>
  );
}
