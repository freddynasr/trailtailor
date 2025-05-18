"use client";
import React, { useEffect } from "react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";

import { Button } from "../ui/button";
import Loading from "../global/loading";
import { useToast } from "@/hooks/use-toast";
import { WebsitePage } from "@prisma/client";
import { WebsitePageSchema } from "@/lib/types";
import {
  deleteWebsiteePage,
  getWebsites,
  saveActivityLogsNotification,
  upsertWebsitePage,
} from "@/lib/queries";
import { useRouter } from "next/navigation";
import { v4 } from "uuid";
import { CopyPlusIcon, Trash } from "lucide-react";
import { useModal } from "@/providers/modal-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CreateWebsitePageProps {
  defaultData?: WebsitePage;
  websiteId: string;
  order: number;
  projectId: string;
  triggerReRender: () => void;
}

const CreateWebsitePage: React.FC<CreateWebsitePageProps> = ({
  defaultData,
  websiteId,
  order,
  projectId,
  triggerReRender,
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const { setClose } = useModal();
  const [copying, setCopying] = React.useState(false);
  //ch
  const form = useForm<z.infer<typeof WebsitePageSchema>>({
    resolver: zodResolver(WebsitePageSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      pathName: "",
    },
  });

  useEffect(() => {
    if (defaultData) {
      form.reset({ name: defaultData.name, pathName: defaultData.pathName });
    }
  }, [defaultData]);

  const onSubmit = async (values: z.infer<typeof WebsitePageSchema>) => {
    if (order !== 0 && !values.pathName)
      return form.setError("pathName", {
        message:
          "Pages other than the first page in the website require a path name example 'secondstep'.",
      });

    try {
      const response = await upsertWebsitePage(
        projectId,
        {
          ...values,
          id: defaultData?.id || v4(),
          order: defaultData?.order || order,
          pathName: values.pathName || "",
        },
        websiteId
      );

      console.log(response);

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Updated a website page | ${response?.name}`,
        projectId: projectId,
      });

      toast({
        title: "Success",
        description: "Saved Website Page Details",
      });

      router.refresh();
      triggerReRender();

      setClose();
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Oops!",
        description: "Could not save Website Page Details",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website Page</CardTitle>
        <CardDescription>
          Website pages are flow in the order they are created by default. You
          can move them around to change their order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6">
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={form.formState.isSubmitting || order === 0}
              control={form.control}
              name="pathName"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Path Name</FormLabel>
                  <FormDescription>
                    Pages other than the first page in the website require a
                    path <br />
                    Path example: secondstep.
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Path for the page"
                      required={order !== 0}
                      {...field}
                      value={field.value?.toLowerCase()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <Button
                className="w-22 self-end"
                disabled={form.formState.isSubmitting}
                type="submit">
                {form.formState.isSubmitting ? <Loading /> : "Save Page"}
              </Button>

              {defaultData?.id && defaultData.pathName !== "" && (
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button
                      variant={"outline"}
                      className="w-22 self-end border-destructive text-destructive hover:bg-destructive"
                      disabled={form.formState.isSubmitting}
                      type="button">
                      {form.formState.isSubmitting ? <Loading /> : <Trash />}
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-left">
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-left">
                        This action cannot be undone. This will permanently
                        delete the user and related data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex items-center">
                      <AlertDialogCancel className="mb-2">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive"
                        onClick={async () => {
                          const response = await deleteWebsiteePage(
                            defaultData.id
                          );
                          await saveActivityLogsNotification({
                            agencyId: undefined,
                            description: `Deleted a website page | ${response?.name}`,
                            projectId: projectId,
                          });
                          toast({
                            title: "Success",
                            description: "Deleted Website Page",
                          });

                          router.refresh();
                          triggerReRender();
                        }}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {defaultData?.id && (
                <Button
                  variant={"outline"}
                  disabled={form.formState.isSubmitting}
                  type="button"
                  onClick={async () => {
                    setCopying(true);
                    const response = await getWebsites(projectId);
                    const lastWebsitePage = response.find(
                      (website) => website.id === websiteId
                    )?.WebsitePages.length;

                    await upsertWebsitePage(
                      projectId,
                      {
                        ...defaultData,
                        id: v4(),
                        order: lastWebsitePage ? lastWebsitePage : 0,
                        visits: 0,
                        name: `${defaultData.name} Copy`,
                        pathName: `${defaultData.pathName}copy`,
                        content: defaultData.content,
                      },
                      websiteId
                    );
                    toast({
                      title: "Success",
                      description: "Saves Website Page Details",
                    });
                    router.refresh();
                    setCopying(false);
                    triggerReRender();
                  }}>
                  {copying ? (
                    <Loading />
                  ) : (
                    <>
                      <CopyPlusIcon />
                      Duplicate Page
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateWebsitePage;
