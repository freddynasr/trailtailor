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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Website, Workflow } from "@prisma/client";
import { Input } from "../ui/input";

import { Button } from "../ui/button";
import Loading from "../global/loading";
import { CreateWorkflowFormSchema } from "@/lib/types";
import {
  saveActivityLogsNotification,
  upsertWebsite,
  upsertWorkflow,
} from "@/lib/queries";
import { v4 } from "uuid";
import { toast } from "@/hooks/use-toast";
import { useModal } from "@/providers/modal-provider";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

interface CreateWorkflowFormProps {
  defaultData?: Workflow;
  projectId: string;
}

const CreateWorkflowForm: React.FC<CreateWorkflowFormProps> = ({
  defaultData,
  projectId,
}) => {
  const { data, isOpen, setOpen, setClose } = useModal();
  const router = useRouter();
  const form = useForm<z.infer<typeof CreateWorkflowFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(CreateWorkflowFormSchema),
    defaultValues: {
      name: defaultData?.name || "",
    },
  });

  useEffect(() => {
    if (defaultData) {
      form.reset({
        name: defaultData.name || "",
      });
    }
  }, [defaultData]);

  const isLoading = form.formState.isLoading;

  const onSubmit = async (values: z.infer<typeof CreateWorkflowFormSchema>) => {
    if (!projectId) return;
    try {
      const response = await upsertWorkflow({
        ...values,
        id: defaultData?.id,
        projectId: projectId,
      });

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Updates a workflow | ${response?.name}`,
        projectId: projectId,
      });

      toast({
        title: "Success",
        description: "Saved workflow details",
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oppse!",
        description: "Could not save workflow details",
      });
    }

    setClose();
  };
  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Workflow Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4">
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workflow Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-20 mt-4" disabled={isLoading} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateWorkflowForm;
