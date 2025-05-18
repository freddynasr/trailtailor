import { getWebsites } from "@/lib/queries";
import React from "react";
import WebsitesDataTable from "./data-table";
import { Plus } from "lucide-react";
import { columns } from "./columns";
import WebsiteForm from "@/components/forms/website-form";
import BlurPage from "@/components/global/blur-page";

const Websites = async ({ params }: { params: { projectId: string } }) => {
  const websites = await getWebsites(params.projectId);
  if (!websites) return null;

  return (
    <BlurPage>
      <WebsitesDataTable
        actionButtonText={
          <>
            <Plus size={15} />
            Create Website
          </>
        }
        modalChildren={<WebsiteForm projectId={params.projectId}></WebsiteForm>}
        filterValue="name"
        columns={columns}
        data={websites}
      />
    </BlurPage>
  );
};

export default Websites;
