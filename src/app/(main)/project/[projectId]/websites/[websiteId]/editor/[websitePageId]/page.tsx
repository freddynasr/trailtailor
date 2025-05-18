/* app/(project)/editor/page.tsx            (Server Component) */
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EditorShellClient from "./_components/EditorShellClient";

type Props = {
  params: { projectId: string; websiteId: string; websitePageId: string };
};

export default async function Page({ params }: Props) {
  const pageDetails = await db.websitePage.findFirst({
    where: { id: params.websitePageId },
  });
  if (!pageDetails) {
    redirect(`/project/${params.projectId}/websites/${params.websiteId}`);
  }

  /* Any data you need on the client gets passed down as props */
  return (
    <EditorShellClient
      projectId={params.projectId}
      websiteId={params.websiteId}
      pageDetails={pageDetails}
    />
  );
}
