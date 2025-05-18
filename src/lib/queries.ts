"use server";

import { clerkClient, currentUser } from "@clerk/nextjs";
import { db } from "./db";
import { redirect } from "next/navigation";
import {
  Agency,
  Lane,
  Plan,
  Prisma,
  Role,
  Project,
  Tag,
  Task,
  User,
} from "@prisma/client";
import { v4 } from "uuid";
import {
  CreateWebsiteFormSchema,
  CreateMediaType,
  UpsertWebsitePage,
} from "./types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const getAuthUserDetails = async () => {
  const user = await currentUser();
  if (!user) {
    return;
  }

  const userData = await db.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    include: {
      Agency: {
        include: {
          SidebarOption: true,
          Project: {
            include: {
              SidebarOption: true,
            },
          },
          Subscription: true,
        },
      },
      Permissions: true,
    },
  });

  return userData;
};

export const saveActivityLogsNotification = async ({
  agencyId,
  description,
  projectId,
}: {
  agencyId?: string;
  description: string;
  projectId?: string;
}) => {
  console.log("id", projectId);
  const authUser = await currentUser();
  let userData;
  if (!authUser) {
    const response = await db.user.findFirst({
      where: {
        Agency: {
          Project: {
            some: { id: projectId },
          },
        },
      },
    });
    if (response) {
      userData = response;
    }
  } else {
    userData = await db.user.findUnique({
      where: { email: authUser?.emailAddresses[0].emailAddress },
    });
  }

  if (!userData) {
    console.log("Could not find a user");
    return;
  }

  let foundAgencyId = agencyId;
  if (!foundAgencyId) {
    if (!projectId) {
      throw new Error("You need to provide atleast an agency Id or project Id");
    }
    const response = await db.project.findUnique({
      where: { id: projectId },
    });
    if (response) foundAgencyId = response.agencyId;
  }
  if (projectId) {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
        Project: {
          connect: { id: projectId },
        },
      },
    });
  } else {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
      },
    });
  }
};

export const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === "AGENCY_OWNER") return null;

  const agencyUsers = await db.user.findMany({ where: { agencyId } });
  const AAgency = await db.agency.findUnique({
    where: { id: agencyId },
    select: {
      id: true,
      Subscription: true,
    },
  });
  console.log(AAgency?.Subscription);

  if (
    agencyUsers.length >= 3 &&
    AAgency?.Subscription?.subscritiptionId === "price_1RG0PDEmUyEyTdquMWX67IPU"
  ) {
    throw new Error("Free plan allows only 3 team members");
  }

  const response = await db.user.create({ data: { ...user } });
  return response;
};

export const verifyAndAcceptInvitation = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");
  const invitationExists = await db.invitation.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
      status: "PENDING",
    },
  });

  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      agencyId: invitationExists.agencyId,
      avatarUrl: user.imageUrl,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: invitationExists.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await saveActivityLogsNotification({
      agencyId: invitationExists?.agencyId,
      description: `Joined`,
      projectId: undefined,
    });

    if (userDetails) {
      await clerkClient.users.updateUserMetadata(user.id, {
        privateMetadata: {
          role: userDetails.role || "PROJECT_USER",
        },
      });

      await db.invitation.delete({
        where: { email: userDetails.email },
      });

      return userDetails.agencyId;
    } else return null;
  } else {
    const agency = await db.user.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
    });
    return agency ? agency.agencyId : null;
  }
};

export const updateAgencyDetails = async (
  agencyId: string,
  agencyDetails: Partial<Agency>
) => {
  const response = await db.agency.update({
    where: { id: agencyId },
    data: { ...agencyDetails },
  });
  return response;
};

export const deleteAgency = async (agencyId: string) => {
  const response = await db.agency.delete({ where: { id: agencyId } });
  return response;
};

export const initUser = async (newUser: Partial<User>) => {
  const user = await currentUser();
  if (!user) return;

  const userData = await db.user.upsert({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    update: newUser,
    create: {
      id: user.id,
      avatarUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
      role: newUser.role || "PROJECT_USER",
    },
  });

  await clerkClient.users.updateUserMetadata(user.id, {
    privateMetadata: {
      role: newUser.role || "PROJECT_USER",
    },
  });

  return userData;
};

export const upsertAgency = async (agency: Agency, price?: Plan) => {
  if (!agency.agencyEmail) return null;
  try {
    const agencyDetails = await db.agency.upsert({
      where: {
        id: agency.id,
      },
      update: agency,
      create: {
        users: {
          connect: { email: agency.agencyEmail },
        },
        ...agency,
        SidebarOption: {
          create: [
            {
              name: "Dashboard",
              icon: "category",
              link: `/agency/${agency.id}/dashboard`,
              order: 0,
            },
            {
              name: "Launchpad",
              icon: "clipboardIcon",
              link: `/agency/${agency.id}/launchpad`,
              order: 5,
            },
            {
              name: "Billing",
              icon: "payment",
              link: `/agency/${agency.id}/billing`,
              order: 3,
            },
            {
              name: "Settings",
              icon: "settings",
              link: `/agency/${agency.id}/settings`,
              order: 4,
            },
            {
              name: "Projects",
              icon: "person",
              link: `/agency/${agency.id}`,
              order: 1,
            },
            {
              name: "Team",
              icon: "shield",
              link: `/agency/${agency.id}/team`,
              order: 2,
            },
          ],
        },
      },
    });
    return agencyDetails;
  } catch (error) {
    console.log(error);
  }
};

export const getNotificationAndUser = async (agencyId: string) => {
  try {
    const response = await db.notification.findMany({
      where: { agencyId },
      include: { User: true },
      orderBy: {
        createdAt: "desc",
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const upsertProject = async (project: Project) => {
  if (!project.agencyEmail) return null;

  // Fetch the agency and its subscription details
  const aagency = await db.agency.findUnique({
    where: { id: project.agencyId },
    select: {
      id: true,
      Subscription: true,
      Project: true, // Include the projects to count them
    },
  });

  if (!aagency) {
    console.log("🔴 Agency not found");
    return null;
  }

  // Check subscription plan and project limits
  const subscriptionId = aagency?.Subscription?.subscritiptionId;
  const projectLimit =
    subscriptionId === "price_1RG0PDEmUyEyTdquMWX67IPU" // Free Plan
      ? Infinity
      : 3;

  if (aagency.Project.length >= projectLimit) {
    throw new Error(
      `Your current plan allows only ${projectLimit} projects. Upgrade your plan to add more projects.`
    );
  }

  // Proceed with upserting the project
  const agencyOwner = await db.user.findFirst({
    where: {
      Agency: {
        id: project.agencyId,
      },
      role: "AGENCY_OWNER",
    },
  });

  if (!agencyOwner) {
    console.log("🔴 Error: Could not find agency owner");
    return null;
  }

  const permissionId = v4();
  const response = await db.project.upsert({
    where: { id: project.id },
    update: project,
    create: {
      ...project,
      Permissions: {
        create: {
          access: true,
          email: agencyOwner.email,
          id: permissionId,
        },
        connect: {
          projectId: project.id,
          id: permissionId,
        },
      },
      Workflow: {
        create: { name: "Lead Cycle" },
      },
      SidebarOption: {
        create: [
          {
            name: "Dashboard",
            icon: "category",
            link: `/project/${project.id}/dashboard`,
            order: 0,
          },
          {
            name: "Websites",
            icon: "workflow",
            link: `/project/${project.id}/websites`,
            order: 1,
          },
          {
            name: "Workflow",
            icon: "flag",
            link: `/project/${project.id}/workflow`,
            order: 2,
          },
          {
            name: "Settings",
            icon: "settings",
            link: `/project/${project.id}/settings`,
            order: 6,
          },
          {
            name: "Media",
            icon: "database",
            link: `/project/${project.id}/media`,
            order: 4,
          },
          {
            name: "Contacts",
            icon: "person",
            link: `/project/${project.id}/contacts`,
            order: 3,
          },
          {
            name: "Launchpad",
            icon: "clipboardIcon",
            link: `/project/${project.id}/launchpad`,
            order: 7,
          },
        ],
      },
    },
  });

  console.log("🟢 Project created:", response.id);
  return response;
};

export const getUserPermissions = async (userId: string) => {
  const response = await db.user.findUnique({
    where: { id: userId },
    select: { Permissions: { include: { Project: true } } },
  });

  return response;
};

export const updateUser = async (user: Partial<User>) => {
  const response = await db.user.update({
    where: { email: user.email },
    data: { ...user },
  });

  await clerkClient.users.updateUserMetadata(response.id, {
    privateMetadata: {
      role: user.role || "PROJECT_USER",
    },
  });

  return response;
};

export const changeUserPermissions = async (
  permissionId: string | undefined,
  userEmail: string,
  projectId: string,
  permission: boolean
) => {
  try {
    const response = await db.permissions.upsert({
      where: { id: permissionId },
      update: { access: permission },
      create: {
        access: permission,
        email: userEmail,
        projectId: projectId,
      },
    });
    return response;
  } catch (error) {
    console.log("🔴Could not change persmission", error);
  }
};

export const getProjectDetails = async (projectId: string) => {
  const response = await db.project.findUnique({
    where: {
      id: projectId,
    },
  });
  return response;
};

export const deleteProject = async (projectId: string) => {
  const response = await db.project.delete({
    where: {
      id: projectId,
    },
  });
  return response;
};

export const deleteUser = async (userId: string) => {
  try {
    // Step 1: Delete the user from Clerk's database
    await clerkClient.users.deleteUser(userId);

    // Step 2: Delete the user from your local database
    const deletedUser = await db.user.delete({ where: { id: userId } });

    return deletedUser;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user from Clerk or the local database.");
  }
};

export const getUser = async (id: string) => {
  const user = await db.user.findUnique({
    where: {
      id,
    },
  });

  return user;
};

export const sendInvitation = async (
  role: Role,
  email: string,
  agencyId: string
) => {
  // 1) Check if the user already exists
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  // 2) Check for an existing pending invitation
  const existingInvitation = await db.invitation.findUnique({
    where: { email },
  });
  if (existingInvitation) {
    throw new Error("An invitation for this email is already pending.");
  }

  // 3) Create a new invitation
  const response = await db.invitation.create({
    data: { email, agencyId, role },
  });

  // 4) Send Clerk invitation
  try {
    await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: process.env.NEXT_PUBLIC_URL,
      publicMetadata: {
        throughInvitation: true,
        role,
      },
      ignoreExisting: true,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }

  return response;
};

export const getMedia = async (projectId: string) => {
  const mediafiles = await db.project.findUnique({
    where: {
      id: projectId,
    },
    include: { Media: true },
  });
  return mediafiles;
};

export const createMedia = async (
  projectId: string,
  mediaFile: CreateMediaType
) => {
  // Check for duplicate link first
  const existingMedia = await db.media.findUnique({
    where: { link: mediaFile.link },
  });
  if (existingMedia) {
    throw new Error("Media with this link already exists.");
  }

  const response = await db.media.create({
    data: {
      link: mediaFile.link,
      name: mediaFile.name,
      projectId: projectId,
    },
  });
  return response;
};

export const deleteMedia = async (mediaId: string) => {
  const response = await db.media.delete({
    where: {
      id: mediaId,
    },
  });
  return response;
};

export const getWorkflowDetails = async (workflowId: string) => {
  const response = await db.workflow.findUnique({
    where: {
      id: workflowId,
    },
  });
  return response;
};

export const getLanesWithTaskAndTags = async (workflowId: string) => {
  const response = await db.lane.findMany({
    where: {
      workflowId,
    },
    orderBy: { order: "asc" },
    include: {
      Tasks: {
        orderBy: {
          order: "asc",
        },
        include: {
          Tags: true,
          Assigned: true,
          Customer: true,
        },
      },
    },
  });
  return response;
};

export const upsertWebsite = async (
  projectId: string,
  website: z.infer<typeof CreateWebsiteFormSchema> & { liveProducts: string },
  websiteId: string
) => {
  const response = await db.website.upsert({
    where: { id: websiteId },
    update: website,
    create: {
      ...website,
      id: websiteId || v4(),
      projectId: projectId,
    },
  });

  return response;
};

export const upsertWorkflow = async (
  workflow: Prisma.WorkflowUncheckedCreateWithoutLaneInput
) => {
  const response = await db.workflow.upsert({
    where: { id: workflow.id || v4() },
    update: workflow,
    create: workflow,
  });

  return response;
};

export const deleteWorkflow = async (workflowId: string) => {
  const response = await db.workflow.delete({
    where: { id: workflowId },
  });
  return response;
};

export const updateLanesOrder = async (lanes: Lane[]) => {
  try {
    const updateTrans = lanes.map((lane) =>
      db.lane.update({
        where: {
          id: lane.id,
        },
        data: {
          order: lane.order,
        },
      })
    );

    await db.$transaction(updateTrans);
    console.log("🟢 Done reordered 🟢");
  } catch (error) {
    console.log(error, "ERROR UPDATE LANES ORDER");
  }
};

export const updateTasksOrder = async (tasks: Task[]) => {
  try {
    const updateTrans = tasks.map((task) =>
      db.task.update({
        where: {
          id: task.id,
        },
        data: {
          order: task.order,
          laneId: task.laneId,
        },
      })
    );

    await db.$transaction(updateTrans);
    console.log("🟢 Done reordered 🟢");
  } catch (error) {
    console.log(error, "🔴 ERROR UPDATE TASK ORDER");
  }
};

export const upsertLane = async (lane: Prisma.LaneUncheckedCreateInput) => {
  let order: number;

  if (!lane.order) {
    const lanes = await db.lane.findMany({
      where: {
        workflowId: lane.workflowId,
      },
    });

    order = lanes.length;
  } else {
    order = lane.order;
  }

  const response = await db.lane.upsert({
    where: { id: lane.id || v4() },
    update: lane,
    create: { ...lane, order },
  });

  return response;
};

export const deleteLane = async (laneId: string) => {
  const resposne = await db.lane.delete({ where: { id: laneId } });
  return resposne;
};

export const getTasksWithTags = async (workflowId: string) => {
  const response = await db.task.findMany({
    where: {
      Lane: {
        workflowId,
      },
    },
    include: { Tags: true, Assigned: true, Customer: true },
  });
  return response;
};

export const _getTasksWithAllRelations = async (laneId: string) => {
  const response = await db.task.findMany({
    where: { laneId: laneId },
    include: {
      Assigned: true,
      Customer: true,
      Lane: true,
      Tags: true,
    },
  });
  return response;
};

export const getProjectTeamMembers = async (projectId: string) => {
  const projectUsersWithAccess = await db.user.findMany({
    where: {
      Agency: {
        Project: {
          some: {
            id: projectId,
          },
        },
      },
      Permissions: {
        some: {
          projectId: projectId,
          access: true,
        },
      },
    },
  });
  return projectUsersWithAccess;
};

export const searchContacts = async (
  searchTerms: string,
  projectId: string
) => {
  const response = await db.contact.findMany({
    where: {
      projectId,
      name: {
        contains: searchTerms,
      },
    },
  });
  return response;
};

export const upsertTask = async (
  task: Prisma.TaskUncheckedCreateInput,
  tags: Tag[]
) => {
  let order: number;
  if (!task.order) {
    const tasks = await db.task.findMany({
      where: { laneId: task.laneId },
    });
    order = tasks.length;
  } else {
    order = task.order;
  }

  const response = await db.task.upsert({
    where: {
      id: task.id || v4(),
    },
    update: { ...task, Tags: { set: tags } },
    create: { ...task, Tags: { connect: tags }, order },
    include: {
      Assigned: true,
      Customer: true,
      Tags: true,
      Lane: true,
    },
  });

  return response;
};

export const deleteTask = async (taskId: string) => {
  const response = await db.task.delete({
    where: {
      id: taskId,
    },
  });

  return response;
};

export const upsertTag = async (
  projectId: string,
  tag: Prisma.TagUncheckedCreateInput
) => {
  const response = await db.tag.upsert({
    where: { id: tag.id || v4(), projectId: projectId },
    update: tag,
    create: { ...tag, projectId: projectId },
  });

  return response;
};

export const getTagsForProject = async (projectId: string) => {
  const response = await db.project.findUnique({
    where: { id: projectId },
    select: { Tags: true },
  });
  return response;
};

export const deleteTag = async (tagId: string) => {
  const response = await db.tag.delete({ where: { id: tagId } });
  return response;
};

export const upsertContact = async (
  contact: Prisma.ContactUncheckedCreateInput
) => {
  const response = await db.contact.upsert({
    where: { id: contact.id || v4() },
    update: contact,
    create: contact,
  });
  return response;
};

export async function deleteContact(contactId: string) {
  // Remove contact from DB
  await db.contact.delete({ where: { id: contactId } });
}

export const getWebsites = async (subacountId: string) => {
  const websites = await db.website.findMany({
    where: { projectId: subacountId },
    include: { WebsitePages: true },
  });

  return websites;
};

export const getWebsite = async (websiteId: string) => {
  const website = await db.website.findUnique({
    where: { id: websiteId },
    include: {
      WebsitePages: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return website;
};

export const updateWebsiteProducts = async (
  products: string,
  websiteId: string
) => {
  const data = await db.website.update({
    where: { id: websiteId },
    data: { liveProducts: products },
  });
  return data;
};

export const upsertWebsitePage = async (
  projectId: string,
  websitePage: UpsertWebsitePage,
  websiteId: string,
  opts?: { silent?: boolean }
) => {
  if (!projectId || !websiteId) return;
  const response = await db.websitePage.upsert({
    where: { id: websitePage.id || "" },
    update: { ...websitePage },
    create: {
      ...websitePage,
      content: websitePage.content
        ? websitePage.content
        : JSON.stringify([
            {
              content: [],
              id: "__body",
              name: "Body",
              styles: { backgroundColor: "white" },
              type: "__body",
            },
          ]),
      websiteId,
    },
  });
  if (!opts?.silent)
    revalidatePath(`/project/${projectId}/websites/${websiteId}`, "page");
  return response;
};

export const deleteWebsiteePage = async (websitePageId: string) => {
  const response = await db.websitePage.delete({
    where: { id: websitePageId },
  });

  return response;
};

export const deleteWebsite = async (websiteId: string) => {
  const response = await db.website.delete({
    where: { id: websiteId },
  });
  return response;
};

export const getWebsitePageDetails = async (websitePageId: string) => {
  const response = await db.websitePage.findUnique({
    where: {
      id: websitePageId,
    },
  });

  return response;
};

export const getDomainContent = async (subDomainName: string) => {
  const response = await db.website.findUnique({
    where: {
      subDomainName,
    },
    include: { WebsitePages: true },
  });
  return response;
};

export const getWorkflow = async (projectId: string) => {
  const response = await db.workflow.findMany({
    where: { projectId: projectId },
    include: {
      Lane: {
        include: { Tasks: true },
      },
    },
  });
  return response;
};
