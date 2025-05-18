"use client";
import React, { useEffect } from "react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Website } from "@prisma/client";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import Loading from "../global/loading";
import { CreateWebsiteFormSchema } from "@/lib/types";
import {
  saveActivityLogsNotification,
  upsertWebsite,
  deleteWebsite,
} from "@/lib/queries";
import { v4 } from "uuid";
import { toast } from "@/hooks/use-toast";
import { useModal } from "@/providers/modal-provider";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import FileUpload from "../global/file-upload";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface CreateWebsiteProps {
  defaultData?: Website;
  projectId: string;
}

const WebsiteForm: React.FC<CreateWebsiteProps> = ({
  defaultData,
  projectId,
}) => {
  const { setClose } = useModal();
  const router = useRouter();

  const form = useForm<z.infer<typeof CreateWebsiteFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(CreateWebsiteFormSchema),
    defaultValues: {
      name: defaultData?.name || "",
      description: defaultData?.description || "",
      favicon: defaultData?.favicon || "",
      subDomainName: defaultData?.subDomainName || "",
    },
  });

  useEffect(() => {
    if (defaultData) {
      form.reset({
        description: defaultData.description || "",
        favicon: defaultData.favicon || "",
        name: defaultData.name || "",
        subDomainName: defaultData.subDomainName || "",
      });
    }
  }, [defaultData]);

  const isLoading = form.formState.isLoading;

  const onSubmit = async (values: z.infer<typeof CreateWebsiteFormSchema>) => {
    if (!projectId) return;
    const response = await upsertWebsite(
      projectId,
      { ...values, liveProducts: defaultData?.liveProducts || "[]" },
      defaultData?.id || v4()
    );
    await saveActivityLogsNotification({
      agencyId: undefined,
      description: `Update website | ${response.name}`,
      projectId: projectId,
    });
    if (response) {
      toast({
        title: "Success",
        description: "Saved website details",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Oppse!",
        description: "Could not save website details",
      });
    }
    setClose();
    router.refresh();
  };

  const handleDelete = async () => {
    if (!defaultData) return;
    try {
      await deleteWebsite(defaultData.id);
      toast({
        title: "Deleted",
        description: "Website has been deleted",
      });
      setClose();
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Couldn't delete website",
      });
    }
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Website Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4">
            {/* Name */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website Name</FormLabel>
                  <FormDescription>
                    General name for the website.
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit more about this website."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Subdomain */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="subDomainName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub domain</FormLabel>
                  <FormDescription>
                    Example: mywebsite <br />
                    It will be used to create a subdomain for the website:
                    <br />
                    mywebsite.trailtailor.vercel.app
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="Sub domain for website" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Favicon */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="favicon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favicon</FormLabel>
                  <FormDescription>
                    Favicon is the icon that appears on the browser tab.
                  </FormDescription>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="projectLogo"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Save button */}
            <Button className="w-20 mt-4" disabled={isLoading} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Save"}
            </Button>

            {/* Danger Zone */}
            {defaultData && (
              <div className="mt-8 p-4 border flex justify-between items-center border-red-500 rounded-md">
                <div>
                  <h2 className="text-red-600 font-semibold">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground ">
                    Deleting this website is permanent and cannot be undone.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-20">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete your website and its
                        associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive" onClick={handleDelete}>
                        Delete
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WebsiteForm;
