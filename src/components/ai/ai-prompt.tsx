"use client";

import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { generateEditorElement } from "@/lib/ai";
import Recursive from "@/app/(main)/project/[projectId]/websites/[websiteId]/editor/[websitePageId]/_components/website-editor/website-editor-components/recursive";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { useEditor } from "@/providers/editor/editor-provider";
import { Loader2 } from "lucide-react";

type Props = {
  containerId: string;
  handleAddComponent: (parsedData: any) => void;
};

const Aiprompt = ({ containerId, handleAddComponent }: Props) => {
  const [prompt, setPrompt] = React.useState("");
  const [parsedData, setParsedData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  const { dispatch, state } = useEditor();

  const fetchAIResponse = async () => {
    setLoading(true);
    const res: any = await generateEditorElement(prompt);
    console.log("Response from AI:", res);
    const json = res.split("---") || res.split("```") || res.split("~~~");

    try {
      setParsedData(JSON.parse(json[1]));
      console.log("Parsed Data:", parsedData);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      toast({
        title: "Error",
        description:
          "There was an error generating components. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const insertIntoEditor = () => {
    // If the AI gave us an array, take its first element; otherwise use the object itself
    const elem = Array.isArray(parsedData) ? parsedData[0] : parsedData;
    if (elem) handleAddComponent(elem);
  };

  // Handle adding the generated component to the selected element

  return (
    <div>
      <form
        className="space-y-2 mb-2"
        onSubmit={(e) => {
          e.preventDefault();
          fetchAIResponse();
        }}>
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <Button>
          {loading ? (
            <Loader2 className=" animate-spin" />
          ) : (
            "Fetch AI Response"
          )}
        </Button>
      </form>
      {Array.isArray(parsedData) && (
        <div className="space-y-2">
          {parsedData.map((childElement) => (
            <Recursive
              key={childElement.id}
              element={childElement}
              parentId={""}
              index={0}
              isExisting={false}
            />
          ))}
        </div>
      )}
      {parsedData && (
        <Button onClick={insertIntoEditor}>Insert Component into Editor</Button>
      )}
    </div>
  );
};

export default Aiprompt;
