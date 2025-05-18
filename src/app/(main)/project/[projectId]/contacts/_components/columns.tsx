"use client";

import { ColumnDef } from "@tanstack/react-table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/providers/modal-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
// Replace with your own function to delete a contact
import { deleteContact } from "@/lib/queries";
import CustomModal from "@/components/global/custom-modal";
import ContactUserForm from "@/components/forms/contact-user-form";
import { Badge } from "@/components/ui/badge";
import { Contact, Task } from "@prisma/client";

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

type ContactWithTasks = Contact & {
  Task?: Task[];
};

export const columns: ColumnDef<ContactWithTasks>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "",
    header: "Status",
    cell: ({ row }) => {
      return formatTotal(row.original.Task ?? []) === "$0.00" ? (
        <Badge variant={"destructive"}>Inactive</Badge>
      ) : (
        <Badge className="bg-emerald-700">Active</Badge>
      );
    },
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => {
      const rowData = row.original;
      return <CellActions rowData={rowData} />;
    },
  },
];

interface CellActionsProps {
  rowData: ContactWithTasks;
}

const CellActions: React.FC<CellActionsProps> = ({ rowData }) => {
  const { toast } = useToast();
  const { setOpen } = useModal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(rowData?.email)}
            className="flex gap-2">
            <Copy size={15} /> Copy Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="flex gap-2"
            onClick={() => {
              setOpen(
                <CustomModal
                  title="Edit Contact"
                  subheading="Update contact details here.">
                  <ContactUserForm
                    projectId={rowData?.projectId}
                    data={rowData}
                  />
                </CustomModal>
              );
            }}>
            <Edit size={15} />
            Edit Contact
          </DropdownMenuItem>

          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="flex gap-2">
              <Trash size={15} /> Remove Contact
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-left">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            This action cannot be undone. This will permanently delete the
            contact and related data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex items-center">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await deleteContact(rowData.id);
              toast({
                title: "Contact Deleted",
                description: "The contact is permanently removed.",
              });
              setLoading(false);
              router.refresh();
            }}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
