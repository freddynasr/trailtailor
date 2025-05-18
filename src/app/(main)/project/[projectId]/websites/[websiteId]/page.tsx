import BlurPage from "@/components/global/blur-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWebsite } from "@/lib/queries";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";
import WebsiteSettings from "./_components/website-settings";
import WebsiteSteps from "./_components/website-steps";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  params: { websiteId: string; projectId: string };
};

const WebsitePage = async ({ params }: Props) => {
  const websitePages = await getWebsite(params.websiteId);
  if (!websitePages) return redirect(`/project/${params.projectId}/websites`);

  return (
    <BlurPage>
      <Link href={`/project/${params.projectId}/websites`} className="">
        <Button variant={"ghost"}>
          <ChevronLeft />
          <span>Back</span>
        </Button>
      </Link>
      <h1 className="text-3xl mb-8">{websitePages.name}</h1>
      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="grid  grid-cols-2 w-[50%] bg-transparent ">
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="steps">
          <WebsiteSteps
            website={websitePages}
            projectId={params.projectId}
            pages={websitePages.WebsitePages}
            websiteId={params.websiteId}
          />
        </TabsContent>
        <TabsContent value="settings">
          <WebsiteSettings
            projectId={params.projectId}
            defaultData={websitePages}
          />
        </TabsContent>
      </Tabs>
    </BlurPage>
  );
};

export default WebsitePage;
