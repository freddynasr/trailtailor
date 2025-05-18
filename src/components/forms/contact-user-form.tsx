"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import Loading from "../global/loading";
import { saveActivityLogsNotification, upsertContact } from "@/lib/queries";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useModal } from "@/providers/modal-provider";
import { Contact } from "@prisma/client";

// 1) Extend schema to include "message"
export const ContactUserFormSchema = z.object({
  name: z.string().nonempty("Name is required"),
  email: z.string().email("Enter a valid email"),
  message: z.string().nonempty("Message is required"),
});

type ContactUserFormSchemaType = z.infer<typeof ContactUserFormSchema>;

interface ContactUserFormProps {
  projectId: string;
  data?: Contact;
}

const ContactUserForm: React.FC<ContactUserFormProps> = ({
  projectId,
  data,
}) => {
  const { setClose } = useModal();
  const router = useRouter();
  const form = useForm<ContactUserFormSchemaType>({
    mode: "onChange",
    resolver: zodResolver(ContactUserFormSchema),
    // 2) Provide defaultValue for "message"
    defaultValues: {
      name: data?.name || "",
      email: data?.email || "",
      message: data?.message || "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form.reset]);

  const isLoading = form.formState.isSubmitting;

  const handleSubmit = async (values: ContactUserFormSchemaType) => {
    try {
      const isNewContact = !data?.id;

      const response = await upsertContact({
        id: data?.id, // Pass ID if it exists for update
        email: values.email,
        projectId,
        name: values.name,
        message: values.message,
      });

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: isNewContact
          ? `Created a new contact | ${response?.name}`
          : `Updated a contact | ${response?.name}`,
        projectId,
      });

      toast({
        title: "Success",
        description: isNewContact ? "Created new contact" : "Updated contact",
      });

      setClose();
      router.refresh();
    } catch (error) {
      console.error("Contact operation failed:", error);
      toast({
        variant: "destructive",
        title: "Oops!",
        description: "Could not save contact details",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contact Info</CardTitle>
        <CardDescription>Manage contact details here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4">
            {/* Name */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormDescription>
                    We will never share your email.
                  </FormDescription>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write Message here" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="mt-4" disabled={isLoading} type="submit">
              {isLoading ? <Loading /> : "Save Contact"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ContactUserForm;
