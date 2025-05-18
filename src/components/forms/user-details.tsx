"use client";
import {
  AuthUserWithAgencySigebarOptionsProjects,
  UserWithPermissionsAndProjects,
} from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { Project, User } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  changeUserPermissions,
  getAuthUserDetails,
  saveActivityLogsNotification,
  updateUser,
} from "@/lib/queries";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "@/components/ui/form";
import FileUpload from "../global/file-upload";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import Loading from "../global/loading";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { v4 } from "uuid";

type Props = {
  id: string | null;
  type: "agency" | "project";
  userData?: Partial<User>;
  projects?: Project[];
};

const UserDetails = ({ id, type, projects, userData }: Props) => {
  const [projectPermissions, setProjectsPermissions] =
    useState<UserWithPermissionsAndProjects | null>(null);

  const { data, setClose } = useModal();
  const [roleState, setRoleState] = useState("");
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [authUserData, setAuthUserData] =
    useState<AuthUserWithAgencySigebarOptionsProjects | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  //Get authUSerDtails

  useEffect(() => {
    if (data.user) {
      const fetchDetails = async () => {
        const response = await getAuthUserDetails();
        if (response) setAuthUserData(response);
      };
      fetchDetails();
    }
  }, [data]);

  const userDataSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    avatarUrl: z.string(),
    role: z.enum([
      "AGENCY_OWNER",
      "AGENCY_ADMIN",
      "PROJECT_USER",
      "PROJECT_GUEST",
    ]),
  });

  const form = useForm<z.infer<typeof userDataSchema>>({
    resolver: zodResolver(userDataSchema),
    mode: "onChange",
    defaultValues: {
      name: userData ? userData.name : data?.user?.name,
      email: userData ? userData.email : data?.user?.email,
      avatarUrl: userData ? userData.avatarUrl : data?.user?.avatarUrl,
      role: userData ? userData.role : data?.user?.role,
    },
  });

  useEffect(() => {
    if (data.user) {
      form.reset(data.user);
    }

    if (userData) {
      form.reset(userData);
      // Use userData to set permissions
      setProjectsPermissions(userData as UserWithPermissionsAndProjects);
    }
  }, [userData, data]);

  const onChangePermission = async (
    projectId: string,
    val: boolean,
    permissionsId: string | undefined
  ) => {
    if (!userData?.email) return;
    setLoadingPermissions(true);
    const response = await changeUserPermissions(
      permissionsId ? permissionsId : v4(),
      userData?.email,
      projectId,
      val
    );
    if (type === "agency") {
      await saveActivityLogsNotification({
        agencyId: authUserData?.Agency?.id,
        description: `Gave ${userData?.name} access to | ${
          projectPermissions?.Permissions.find((p) => p.projectId === projectId)
            ?.Project.name
        } `,
        projectId: projectPermissions?.Permissions.find(
          (p) => p.projectId === projectId
        )?.Project.id,
      });
    }

    if (response) {
      toast({
        title: "Success",
        description: `Updated ${userData?.name} permissions`,
      });
      if (projectPermissions) {
        const updatedPermissions = {
          ...projectPermissions,
          Permissions: projectPermissions.Permissions.map((perm) => {
            if (perm.projectId === projectId) {
              return { ...perm, access: val };
            }
            return perm;
          }),
        };
        setProjectsPermissions(updatedPermissions);
      }
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not update permissions",
      });
    }
    router.refresh();
    setLoadingPermissions(false);
  };

  const onSubmit = async (values: z.infer<typeof userDataSchema>) => {
    if (!id) return;
    if (userData || data?.user) {
      const updatedUser = await updateUser(values);
      authUserData?.Agency?.Project.filter((subacc) =>
        authUserData.Permissions.find(
          (p) => p.projectId === subacc.id && p.access
        )
      ).forEach(async (project) => {
        await saveActivityLogsNotification({
          agencyId: undefined,
          description: `Updated ${userData?.name} information`,
          projectId: project.id,
        });
      });

      if (updatedUser) {
        toast({
          title: "Success",
          description: "Update User Information",
        });
        setClose();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Oppse!",
          description: "Could not update user information",
        });
      }
    } else {
      console.log("Error could not submit");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Details</CardTitle>
        <CardDescription>Add or update your information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile picture</FormLabel>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="avatar"
                      value={field.value}
                      onChange={field.onChange}
                      isUser={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>User full name</FormLabel>
                  <FormControl>
                    <Input required placeholder="Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      readOnly={
                        userData?.role === "AGENCY_OWNER" ||
                        form.formState.isSubmitting
                      }
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel> User Role</FormLabel>
                  <Select
                    disabled={field.value === "AGENCY_OWNER"}
                    onValueChange={(value) => {
                      if (
                        value === "PROJECT_USER" ||
                        value === "PROJECT_GUEST"
                      ) {
                        setRoleState(
                          "You need to have projects to assign Project access to team members."
                        );
                      } else {
                        setRoleState("");
                      }
                      field.onChange(value);
                    }}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {
                        // Only Agency Owner can assign Agency Admin
                        (data?.user?.role === "AGENCY_OWNER" ||
                          userData?.role === "AGENCY_OWNER") && (
                          <SelectItem value="AGENCY_ADMIN">
                            Agency Admin
                          </SelectItem>
                        )
                      }
                      {(data?.user?.role === "AGENCY_OWNER" ||
                        userData?.role === "AGENCY_OWNER") && (
                        <SelectItem value="AGENCY_OWNER">
                          Agency Owner
                        </SelectItem>
                      )}
                      <SelectItem value="PROJECT_USER">
                        Project Assistant
                      </SelectItem>
                      <SelectItem value="PROJECT_GUEST">
                        Project Guest
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground">{roleState}</p>
                </FormItem>
              )}
            />

            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Save User Details"}
            </Button>
            {data?.user?.role !== "AGENCY_OWNER" &&
              data?.user?.role !== "AGENCY_ADMIN" &&
              userData?.role !== "AGENCY_OWNER" &&
              userData?.role !== "AGENCY_ADMIN" && (
                <div>
                  <Separator className="my-4" />
                  <FormLabel> User Permissions</FormLabel>
                  <FormDescription className="mb-4">
                    You can give Project access to team member by turning on
                    access control for each Project. This is only visible to
                    agency owners
                  </FormDescription>
                  <div className="flex flex-col gap-4">
                    {projects?.map((project) => {
                      const projectPermissionsDetails =
                        projectPermissions?.Permissions.find((p) => {
                          console.log(p.projectId === project.id);
                          return p.projectId === project.id;
                        });
                      console.log(projectPermissionsDetails);
                      return (
                        <div
                          key={project.id}
                          className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <p>{project.name}</p>
                          </div>
                          <Switch
                            disabled={loadingPermissions}
                            checked={projectPermissionsDetails?.access}
                            onCheckedChange={(permission) => {
                              console.log(permission);
                              onChangePermission(
                                project.id,
                                permission,
                                projectPermissionsDetails?.id
                              );
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UserDetails;
