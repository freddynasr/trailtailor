import React from "react";

import { Website, Project } from "@prisma/client";
import { db } from "@/lib/db";
import { getConnectAccountProducts } from "@/lib/stripe/stripe-actions";

import WebsiteForm from "@/components/forms/website-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WebsiteProductsTable from "./website-products-table";

interface WebsiteSettingsProps {
  projectId: string;
  defaultData: Website;
}

const WebsiteSettings: React.FC<WebsiteSettingsProps> = async ({
  projectId,
  defaultData,
}) => {
  //CHALLENGE: go connect your stripe to sell products

  const projectDetails = await db.project.findUnique({
    where: {
      id: projectId,
    },
  });

  const products =
    projectDetails && projectDetails.connectAccountId
      ? await getConnectAccountProducts(projectDetails.connectAccountId)
      : [];

  return (
    <div className="flex gap-4 flex-col xl:!flex-row">
      {projectDetails && projectDetails.connectAccountId && (
        <Card className="flex-1 flex-shrink">
          <CardHeader>
            <CardTitle>Website Products</CardTitle>
            <CardDescription>
              Select the products and services you wish to sell on this website.
              You can sell one time and recurring products too.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <>
              {projectDetails.connectAccountId ? (
                <WebsiteProductsTable
                  defaultData={defaultData}
                  products={products}
                />
              ) : (
                "Connect your stripe account to sell products."
              )}
            </>
          </CardContent>
        </Card>
      )}

      <WebsiteForm projectId={projectId} defaultData={defaultData} />
    </div>
  );
};

export default WebsiteSettings;
