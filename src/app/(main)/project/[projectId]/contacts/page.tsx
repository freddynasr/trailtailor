import BlurPage from "@/components/global/blur-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { Contact, Project, Task } from "@prisma/client";
import React from "react";
import CraeteContactButton from "./_components/create-contact-btn";
import { format } from "date-fns";
import DataTable from "@/app/(main)/agency/[agencyId]/team/data-table";
import { columns } from "./_components/columns";

type Props = {
  params: { projectId: string };
};

const ContactPage = async ({ params }: Props) => {
  type ProjectWithContacts = Project & {
    Contact: (Contact & { Task: Task[] })[];
  };

  const contacts = (await db.project.findUnique({
    where: {
      id: params.projectId,
    },

    include: {
      Contact: {
        include: {
          Task: {
            select: {
              value: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })) as ProjectWithContacts;

  const allContacts = contacts.Contact;

  const formatTotal = (tasks: Task[]) => {
    if (!tasks || !tasks.length) return "$0.00";
    const amt = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    });

    const laneAmt = tasks.reduce(
      (sum, task) => sum + (Number(task?.value) || 0),
      0
    );

    return amt.format(laneAmt);
  };
  return (
    <BlurPage>
      <h1 className="text-4xl p-4">Contacts</h1>
      <CraeteContactButton projectId={params.projectId} />
      {/* <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="w-[300px]">Email</TableHead>
            <TableHead className="w-[200px]">Active</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium truncate">
          {allContacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <Avatar>
                  <AvatarImage alt="@shadcn" />
                  <AvatarFallback className="bg-primary text-white">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>
                {formatTotal(contact.Task) === "$0.00" ? (
                  <Badge variant={"destructive"}>Inactive</Badge>
                ) : (
                  <Badge className="bg-emerald-700">Active</Badge>
                )}
              </TableCell>
              <TableCell>{format(contact.createdAt, "MM/dd/yyyy")}</TableCell>
              <TableCell className="text-right">
                {formatTotal(contact.Task)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table> */}

      <div className="p-4">
        <DataTable columns={columns} data={allContacts} filterValue="name" />
      </div>
    </BlurPage>
  );
};

export default ContactPage;
