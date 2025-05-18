"use client";
import {
  getProjectTeamMembers,
  saveActivityLogsNotification,
  searchContacts,
  upsertTask,
} from "@/lib/queries";
import { TaskFormSchema, TaskWithTags } from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Contact, Tag, User } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { CheckIcon, ChevronsUpDownIcon, User2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn } from "@/lib/utils";
import Loading from "../global/loading";
import TagCreator from "../global/tag-creator";

type Props = {
  laneId: string;
  projectId: string;
  getNewTask: (task: TaskWithTags[0]) => void;
};

const TaskForm = ({ getNewTask, laneId, projectId }: Props) => {
  const { data: defaultData, setClose } = useModal();
  const router = useRouter();

  const [tags, setTags] = useState<Tag[]>([]);
  const [contact, setContact] = useState("");
  const [search, setSearch] = useState("");
  const [contactList, setContactList] = useState<Contact[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [allTeamMembers, setAllTeamMembers] = useState<User[]>([]);
  const [assignedTo, setAssignedTo] = useState(
    defaultData.task?.Assigned?.id || ""
  );

  const form = useForm<z.infer<typeof TaskFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      name: defaultData.task?.name || "",
      description: defaultData.task?.description || "",
      value: String(defaultData.task?.value || 0),
    },
  });

  const isLoading = form.formState.isSubmitting;

  // Fetch team members
  useEffect(() => {
    if (projectId) {
      const fetchData = async () => {
        const response = await getProjectTeamMembers(projectId);
        if (response) setAllTeamMembers(response);
      };
      fetchData();
    }
  }, [projectId]);

  // Fetch initial contacts (in case no existing task data)
  useEffect(() => {
    if (projectId) {
      const fetchContacts = async () => {
        const response = await searchContacts("", projectId);
        setContactList(response);
      };
      fetchContacts();
    }
  }, [projectId]);

  // If a task is provided, reset form and fetch relevant contacts
  useEffect(() => {
    if (defaultData.task) {
      form.reset({
        name: defaultData.task.name || "",
        description: defaultData.task.description || "",
        value: String(defaultData.task.value || 0),
      });

      if (defaultData.task.customerId) setContact(defaultData.task.customerId);

      const fetchData = async () => {
        const response = await searchContacts(
          defaultData.task?.Customer?.name || "",
          projectId
        );
        setContactList(response);
      };
      fetchData();
    }
  }, [defaultData, form, projectId]);

  const onSubmit = async (values: z.infer<typeof TaskFormSchema>) => {
    if (!laneId) return;
    try {
      const response = await upsertTask(
        {
          ...values,
          laneId,
          id: defaultData.task?.id,
          assignedUserId: assignedTo,
          ...(contact ? { customerId: contact } : {}),
        },
        tags
      );

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Updated a task | ${response?.name}`,
        projectId,
      });

      toast({
        title: "Success",
        description: "Saved details",
      });
      if (response) getNewTask(response);
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Task Details</CardTitle>
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
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Value */}
            <FormField
              disabled={isLoading}
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Value/Cost</FormLabel>
                  <FormControl>
                    <Input placeholder="Value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tag Creator */}
            <h3>Add tags</h3>
            <TagCreator
              projectId={projectId}
              getSelectedTags={setTags}
              defaultTags={defaultData.task?.Tags || []}
            />

            {/* Assigned To */}
            <FormLabel>Assigned To Team Member</FormLabel>
            <Select onValueChange={setAssignedTo} defaultValue={assignedTo}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage alt="contact" />
                        <AvatarFallback className="bg-primary text-sm text-white">
                          <User2 size={14} />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        Not Assigned
                      </span>
                    </div>
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {allTeamMembers.map((teamMember) => (
                  <SelectItem key={teamMember.id} value={teamMember.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage alt="contact" src={teamMember.avatarUrl} />
                        <AvatarFallback className="bg-primary text-sm text-white">
                          <User2 size={14} />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {teamMember.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Customer */}
            <FormLabel>Customer</FormLabel>
            <Popover>
              <PopoverTrigger asChild className="w-full">
                <Button
                  variant="outline"
                  role="combobox"
                  className="justify-between">
                  {contact
                    ? contactList.find((c) => c.id === contact)?.name
                    : "Select Customer..."}
                  <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search..."
                    className="h-9"
                    value={search}
                    onChangeCapture={async (value) => {
                      // Stop any pending searches
                      if (saveTimerRef.current)
                        clearTimeout(saveTimerRef.current);
                      //@ts-ignore
                      setSearch(value.target.value);

                      // Delay one second before sending search request
                      saveTimerRef.current = setTimeout(async () => {
                        const response = await searchContacts(
                          //@ts-ignore
                          value.target.value,
                          projectId
                        );
                        setContactList(response);
                        setSearch("");
                      }, 1000);
                    }}
                  />
                  <CommandEmpty>No Customer found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {contactList.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.id}
                          onSelect={(currentValue) => {
                            setContact(
                              currentValue === contact ? "" : currentValue
                            );
                          }}>
                          {c.name}
                          <CheckIcon
                            className={cn(
                              "ml-auto h-4 w-4",
                              contact === c.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Submit button */}
            <Button className="w-20 mt-4" disabled={isLoading} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TaskForm;
