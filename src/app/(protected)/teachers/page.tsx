"use client";

import {
  PencilIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import swal from "sweetalert";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// ── Top Up Hours modal ────────────────────────────────────────────────────────
function TopUpModal({
  professor,
  open,
  onOpenChange,
  onSuccess,
}: {
  professor: Professor | null;
  open: boolean;
  onOpenChange: (_value: boolean) => void;
  onSuccess: () => void;
}) {
  const [hours, setHours] = useState("");
  const [mode, setMode] = useState<"add" | "set">("add");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setHours("");
      setMode("add");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(hours);
    if (isNaN(n) || n < 0) {
      swal("Error", "Enter a valid non-negative number of hours.", "error");
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/user/users/${professor!.id}/top_up_hours/`, {
        method: "POST",
        body: JSON.stringify({ hours: n, mode }),
      });
      swal(
        "Done!",
        `Hours ${mode === "set" ? "set to" : "added:"} ${n} for ${professor!.full_name}.`,
        "success"
      );
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      swal(
        "Error",
        (err as Error)?.message || "Failed to update hours.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Top Up Hours — {professor?.full_name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Current remaining:{" "}
          <strong>{professor?.remaining_hours ?? 0} hrs</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Mode</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-black"
              value={mode}
              onChange={(e) => setMode(e.target.value as "add" | "set")}
            >
              <option value="add">Add hours (on top of existing)</option>
              <option value="set">Set hours (overwrite to exact value)</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Hours</Label>
            <Input
              type="number"
              min={0}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 10"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  onTopUp: (_p: Professor) => void;
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
  onTopUp,
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
            <TableHead>Role</TableHead>
            {!isPro && <TableHead>Region</TableHead>}
            <TableHead>Contact</TableHead>
            <TableHead>Purchased Hrs</TableHead>
            <TableHead>Remaining Hrs</TableHead>
            <TableHead>Used Hrs</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Approval</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {professors.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isPro ? 10 : 11}
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
                <TableCell>{prof.role}</TableCell>
                {!isPro && <TableCell>{prof.region_name || "-"}</TableCell>}
                <TableCell>{prof.contact_number || "-"}</TableCell>
                <TableCell>{prof.total_purchased_hours ?? "-"}</TableCell>
                <TableCell>{prof.remaining_hours ?? "-"}</TableCell>
                <TableCell>{prof.used_hours ?? "-"}</TableCell>
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
                      className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                      onClick={() => onTopUp(prof)}
                    >
                      <PlusCircleIcon className="w-4 h-4 mr-1" /> Top Up
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
  const [topUpModal, setTopUpModal] = useState<{
    open: boolean;
    data: Professor | null;
  }>({
    open: false,
    data: null,
  });
  const [activeTab, setActiveTab] = useState<"pro" | "public">("pro");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const currentList = activeTab === "pro" ? pro : pub;

  const openAdd = () => setModal({ open: true, data: null });
  const openEdit = (p: Professor) => setModal({ open: true, data: p });
  const openTopUp = (p: Professor) => setTopUpModal({ open: true, data: p });

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
            onTopUp={openTopUp}
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
            onTopUp={openTopUp}
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

      <TopUpModal
        open={topUpModal.open}
        onOpenChange={(open) =>
          setTopUpModal({ open, data: open ? topUpModal.data : null })
        }
        professor={topUpModal.data}
        onSuccess={() => {
          pro.fetch();
          pub.fetch();
        }}
      />
    </div>
  );
}
