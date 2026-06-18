"use client";

import { PencilIcon, ShieldCheckIcon, UserCheckIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import swal from "sweetalert";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableLoader } from "@/components/ui/TableLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { deleteProfessor } from "@/lib/apiActions";
import { PaginatedResponse, Professor } from "@/types/api";

import { TeacherModal } from "./TeacherModal";

interface ProfessorTableProps {
  professors: Professor[];
  loading: boolean;
  actionLoadingId: number | null;
  deleteLoadingId: number | null;
  prevUrl: string | null;
  nextUrl: string | null;
  onEdit: (_p: Professor) => void;
  onApproval: (_id: number, _approve: boolean) => void;
  onDelete: (_p: Professor) => void;
  onPrev: () => void;
  onNext: () => void;
  emptyMessage: string;
  isPro?: boolean;
}

function ProfessorTable({
  professors,
  loading,
  actionLoadingId,
  deleteLoadingId,
  prevUrl,
  nextUrl,
  onEdit,
  onApproval,
  onDelete,
  onPrev,
  onNext,
  emptyMessage,
  isPro = false,
}: ProfessorTableProps) {
  if (loading) return <TableLoader />;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Full Name</TableHead>
            {!isPro && <TableHead>Region</TableHead>}
            <TableHead>Contact</TableHead>
            {isPro && <TableHead>Purchased Hrs</TableHead>}
            {isPro && <TableHead>Remaining Hrs</TableHead>}
            {isPro && <TableHead>Used Hrs</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Approval</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {professors.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isPro ? 10 : 8}
                className="text-center py-10 text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            professors.map((prof) => (
              <TableRow key={prof.id}>
                <TableCell>{prof.email}</TableCell>
                <TableCell>{prof.full_name}</TableCell>
                {!isPro && <TableCell>{prof.region_name || "-"}</TableCell>}
                <TableCell>{prof.contact_number || "-"}</TableCell>
                {isPro && (
                  <TableCell>{prof.total_purchased_hours ?? "-"}</TableCell>
                )}
                {isPro && <TableCell>{prof.remaining_hours ?? "-"}</TableCell>}
                {isPro && <TableCell>{prof.used_hours ?? "-"}</TableCell>}
                <TableCell>
                  {prof.is_active ? (
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    disabled={actionLoadingId === prof.id}
                    variant={prof.is_active ? "destructive" : "secondary"}
                    onClick={() => onApproval(prof.id!, !prof.is_active)}
                  >
                    {actionLoadingId === prof.id
                      ? "Processing..."
                      : prof.is_active
                        ? "Cancel"
                        : "Approve"}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(prof)}
                    >
                      <PencilIcon className="w-4 h-4" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                      disabled={deleteLoadingId === prof.id}
                      onClick={() => onDelete(prof)}
                    >
                      {deleteLoadingId === prof.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (prevUrl) onPrev();
              }}
              className={!prevUrl ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (nextUrl) onNext();
              }}
              className={!nextUrl ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}

function useProfessors(isPublic: boolean) {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = `/user/users/?role=professor&is_public=${isPublic}`;

  const fetch = useCallback(
    async (url: string = baseUrl) => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Professor> = await apiFetch(url);
        setProfessors(res.results);
        setNextUrl(res.next);
        setPrevUrl(res.previous);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { professors, nextUrl, prevUrl, loading, fetch, baseUrl };
}

export default function TeachersPage() {
  const pro = useProfessors(false);
  const pub = useProfessors(true);

  const [modal, setModal] = useState<{ open: boolean; data: Professor | null }>(
    {
      open: false,
      data: null,
    }
  );
  const [activeTab, setActiveTab] = useState<"pro" | "public">("pro");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const currentList = activeTab === "pro" ? pro : pub;

  const openAdd = () => setModal({ open: true, data: null });
  const openEdit = (p: Professor) => setModal({ open: true, data: p });

  const handleApproval = async (userId: number, approve: boolean) => {
    setActionLoadingId(userId);
    try {
      await apiFetch(
        approve
          ? `/user/users/approve/?user_id=${userId}`
          : `/user/users/cancel/?user_id=${userId}`,
        { method: "GET" }
      );
      swal({ title: approve ? "Approved!" : "Cancelled!", icon: "success" });
      currentList.fetch();
    } catch (err: unknown) {
      swal({
        title: "Error!",
        text: (err as Error)?.message || "Action failed",
        icon: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (prof: Professor) => {
    const confirmed = await swal({
      title: "Are you sure?",
      text: `This will permanently delete ${prof.full_name}.`,
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!confirmed) return;

    setDeleteLoadingId(prof.id ?? null);
    try {
      await deleteProfessor(prof.id!);
      swal({ title: "Deleted!", icon: "success" });
      currentList.fetch();
    } catch (err) {
      swal({
        title: "Error!",
        text: (err as Error)?.message || "Delete failed",
        icon: "error",
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 mx-2">
        <h2 className="text-2xl font-bold">Professors</h2>
        {activeTab === "public" && (
          <Button onClick={openAdd}>Add Professor</Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "pro" | "public")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="pro" className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" />
            Pro Professors
            {!pro.loading && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({pro.professors.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <UserCheckIcon className="w-4 h-4" />
            Public Professors
            {!pub.loading && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({pub.professors.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pro">
          <p className="text-sm text-muted-foreground mb-3">
            Professors who signed up themselves through the public site.
          </p>
          <ProfessorTable
            professors={pro.professors}
            loading={pro.loading}
            actionLoadingId={actionLoadingId}
            deleteLoadingId={deleteLoadingId}
            prevUrl={pro.prevUrl}
            nextUrl={pro.nextUrl}
            onEdit={openEdit}
            onApproval={handleApproval}
            onDelete={handleDelete}
            onPrev={() => pro.fetch(pro.prevUrl!)}
            onNext={() => pro.fetch(pro.nextUrl!)}
            emptyMessage="No pro professors yet. They will appear here when professors sign up themselves."
            isPro
          />
        </TabsContent>

        <TabsContent value="public">
          <p className="text-sm text-muted-foreground mb-3">
            Professors created by the admin. Use &apos;Add Professor&apos; to
            create one.
          </p>
          <ProfessorTable
            professors={pub.professors}
            loading={pub.loading}
            actionLoadingId={actionLoadingId}
            deleteLoadingId={deleteLoadingId}
            prevUrl={pub.prevUrl}
            nextUrl={pub.nextUrl}
            onEdit={openEdit}
            onApproval={handleApproval}
            onDelete={handleDelete}
            onPrev={() => pub.fetch(pub.prevUrl!)}
            onNext={() => pub.fetch(pub.nextUrl!)}
            emptyMessage="No public professors yet. Use 'Add Professor' to create one."
          />
        </TabsContent>
      </Tabs>

      <TeacherModal
        open={modal.open}
        onOpenChange={(open) =>
          setModal({ open, data: open ? modal.data : null })
        }
        onSuccess={() => {
          pro.fetch();
          pub.fetch();
        }}
        initialData={modal.data}
      />
    </div>
  );
}
