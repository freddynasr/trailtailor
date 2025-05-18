"use client";
import Loading from "@/components/global/loading";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { EditorBtns } from "@/lib/constants";
import { getWebsite, getProjectDetails } from "@/lib/queries";
import { getStripe } from "@/lib/stripe/stripe-client";
import { EditorElement, useEditor } from "@/providers/editor/editor-provider";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import clsx from "clsx";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import SortableElement from "../sortable-element";

type Props = {
  element: EditorElement;
  parentId: string;
  index: number;
  isExisting: boolean;
};

const Checkout = ({ element, parentId, index, isExisting }: Props) => {
  const { dispatch, state, projectId, websiteId, pageDetails } = useEditor();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState("");
  const [livePrices, setLivePrices] = useState([]);
  const [projectConnectAccId, setProjectConnectAccId] = useState("");
  const options = useMemo(() => ({ clientSecret }), [clientSecret]);
  const styles = element.styles;

  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      const projectDetails = await getProjectDetails(projectId);
      if (projectDetails) {
        if (!projectDetails.connectAccountId) return;
        setProjectConnectAccId(projectDetails.connectAccountId);
      }
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (websiteId) {
      const fetchData = async () => {
        const websiteData = await getWebsite(websiteId);
        setLivePrices(JSON.parse(websiteData?.liveProducts || "[]"));
      };
      fetchData();
    }
  }, [websiteId]);

  useEffect(() => {
    if (livePrices.length && projectId && projectConnectAccId) {
      const getClientSercet = async () => {
        try {
          const body = JSON.stringify({
            projectConnectAccId,
            prices: livePrices,
            projectId,
          });
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_URL}api/stripe/create-checkout-session`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            }
          );
          const responseJson = await response.json();
          console.log(responseJson);
          if (!responseJson) throw new Error("somethign went wrong");
          if (responseJson.error) {
            throw new Error(responseJson.error);
          }
          if (responseJson.clientSecret) {
            setClientSecret(responseJson.clientSecret);
          }
        } catch (error) {
          toast({
            open: true,
            className: "z-[100000]",
            variant: "destructive",
            title: "Oppse!",
            //@ts-ignore
            description: error.message,
          });
        }
      };
      getClientSercet();
    }
  }, [livePrices, projectId, projectConnectAccId]);

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

  const goToNextPage = async () => {
    if (!state.editor.liveMode) return;
    const websitePages = await getWebsite(websiteId);
    if (!websitePages || !pageDetails) return;
    if (websitePages.WebsitePages.length > pageDetails.order + 1) {
      console.log(websitePages.WebsitePages.length, pageDetails.order + 1);
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

  return (
    <SortableElement
      id={element.id}
      data={{ parentId, index, isExisting }}
      style={styles}
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

      <div className="border-none transition-all w-full">
        <div className="flex flex-col gap-4 w-full">
          {options.clientSecret && projectConnectAccId && (
            <div className="text-white">
              <EmbeddedCheckoutProvider
                stripe={getStripe(projectConnectAccId)}
                options={options}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}

          {!options.clientSecret && (
            <div className="flex items-center justify-center w-full h-40">
              <Loading />
            </div>
          )}
        </div>
      </div>

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

export default Checkout;
