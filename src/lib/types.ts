import {
  Contact,
  Lane,
  Notification,
  Prisma,
  Role,
  Tag,
  Task,
  User,
} from "@prisma/client";
import {
  _getTasksWithAllRelations,
  getAuthUserDetails,
  getWebsites,
  getMedia,
  getWorkflowDetails,
  getTasksWithTags,
  getUserPermissions,
} from "./queries";
import { db } from "./db";
import { z } from "zod";

import Stripe from "stripe";

export type NotificationWithUser =
  | ({
      User: {
        id: string;
        name: string;
        avatarUrl: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        role: Role;
        agencyId: string | null;
      };
    } & Notification)[]
  | undefined;

export type UserWithPermissionsAndProjects = Prisma.PromiseReturnType<
  typeof getUserPermissions
>;

export const WebsitePageSchema = z.object({
  name: z.string().min(1),
  pathName: z
    .string()
    .regex(
      /^$|^[a-zA-Z0-9-]+$/,
      "Invalid path. Use letters, numbers, and hyphens."
    ),
});

const __getUsersWithAgencyProjectPermissionsSidebarOptions = async (
  agencyId: string
) => {
  return await db.user.findFirst({
    where: { Agency: { id: agencyId } },
    include: {
      Agency: { include: { Project: true } },
      Permissions: { include: { Project: true } },
    },
  });
};

export type AuthUserWithAgencySigebarOptionsProjects = Prisma.PromiseReturnType<
  typeof getAuthUserDetails
>;

export type UsersWithAgencyProjectPermissionsSidebarOptions =
  Prisma.PromiseReturnType<
    typeof __getUsersWithAgencyProjectPermissionsSidebarOptions
  >;

export type GetMediaFiles = Prisma.PromiseReturnType<typeof getMedia>;

export type CreateMediaType = Prisma.MediaCreateWithoutProjectInput;

export type TaskAndTags = Task & {
  Tags: Tag[];
  Assigned: User | null;
  Customer: Contact | null;
};

export type LaneDetail = Lane & {
  Tasks: TaskAndTags[];
};

export const CreateWorkflowFormSchema = z.object({
  name: z.string().min(1),
});

export const CreateWebsiteFormSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  favicon: z.string().optional(),
  subDomainName: z
    .string()
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Invalid subdomain. Use only letters, numbers, and hyphens."
    ),
});

export type WorkflowDetailsWithLanesCardsTagsTasks = Prisma.PromiseReturnType<
  typeof getWorkflowDetails
>;

export const LaneFormSchema = z.object({
  name: z.string().min(1),
});

export type TaskWithTags = Prisma.PromiseReturnType<typeof getTasksWithTags>;

const currencyNumberRegex = /^\d+(\.\d{1,2})?$/;

export const TaskFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  value: z.string().refine((value) => currencyNumberRegex.test(value), {
    message: "Value must be a valid price.",
  }),
});

export type TaskDetails = Prisma.PromiseReturnType<
  typeof _getTasksWithAllRelations
>;

export const ContactUserFormSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email(),
  message: z.string().min(1, "Required"),
});

export type Address = {
  city: string;
  country: string;
  line1: string;
  postal_code: string;
  state: string;
};

export type ShippingInfo = {
  address: Address;
  name: string;
};

export type StripeCustomerType = {
  email: string;
  name: string;
  shipping: ShippingInfo;
  address: Address;
};

export type PricesList = Stripe.ApiList<Stripe.Price>;

export type WebsitesForProject = Prisma.PromiseReturnType<
  typeof getWebsites
>[0];

export type UpsertWebsitePage = Prisma.WebsitePageCreateWithoutWebsiteInput;
