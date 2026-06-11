"use client";

import {
  PencilIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserCheckIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import swal from "sweetalert";

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
import { deleteStudent } from "@/lib/apiActions";
import { PaginatedResponse, Student } from "@/types/api";

import { StudentModal } from "./StudentModal";

function useStudents(isPublic: boolean) {
  const [students, setStudents] = useState<Student[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = `/user/students/?is_public=${isPublic}`;

  const fetchStudents = useCallback(
    async (url: string = baseUrl) => {
      setLoading(true);
      try {
        const res: PaginatedResponse<Student> = await apiFetch(url);

        setStudents(res.results);
        setNextUrl(res.next);
        setPrevUrl(res.previous);
      } catch {
        setStudents([]);
        setNextUrl(null);
        setPrevUrl(null);
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, nextUrl, prevUrl, loading, fetchStudents };
}

function StudentTable({
  students,
  loading,
  deleteLoadingId,
  prevUrl,
  nextUrl,
  onEdit,
  onDelete,
  onPrev,
  onNext,
}: {
  students: Student[];
  loading: boolean;
  deleteLoadingId: number | null;
  prevUrl: string | null;
  nextUrl: string | null;
  onEdit: (_student: Student) => void;
  onDelete: (_student: Student) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (loading) return <TableLoader />;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Contact Number</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No students found
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.full_name}</TableCell>
                <TableCell>{student.contact_number || "-"}</TableCell>

                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(student)}
                    >
                      <PencilIcon className="w-4 h-4" /> Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                      disabled={deleteLoadingId === student.id}
                      onClick={() => onDelete(student)}
                    >
                      {deleteLoadingId === student.id ? (
                        "Deleting..."
                      ) : (
                        <>
                          <Trash2Icon className="w-4 h-4 mr-1" /> Delete
                        </>
                      )}
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
              onClick={(event) => {
                event.preventDefault();
                if (prevUrl) onPrev();
              }}
              className={!prevUrl ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
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

export default function StudentsPage() {
  const pro = useStudents(false);
  const pub = useStudents(true);

  const [modal, setModal] = useState<{ open: boolean; data: Student | null }>({
    open: false,
    data: null,
  });
  const [activeTab, setActiveTab] = useState<"pro" | "public">("pro");
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const currentList = activeTab === "pro" ? pro : pub;

  const openAdd = () => setModal({ open: true, data: null });
  const openEdit = (student: Student) =>
    setModal({ open: true, data: student });

  const handleDeleteStudent = async (student: Student) => {
    const confirm = await swal({
      title: "Are you sure?",
      text: `This will permanently delete ${student.full_name}.`,
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });

    if (!confirm) return;

    setDeleteLoadingId(student.id);

    try {
      await deleteStudent(student.id);

      swal({
        title: "Deleted!",
        text: "Student deleted successfully!",
        icon: "success",
      });

      currentList.fetchStudents();
    } catch (error) {
      swal({
        title: "Error!",
        text: (error as Error)?.message || "Delete failed",
        icon: "error",
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold px-2">Students</h2>
        {activeTab === "pro" && <Button onClick={openAdd}>Add Student</Button>}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "pro" | "public")}
        className="mb-4"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="pro" className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" />
            Pro Students
            {!pro.loading && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({pro.students.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <UserCheckIcon className="w-4 h-4" />
            Public Students
            {!pub.loading && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({pub.students.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pro">
          <StudentTable
            students={pro.students}
            loading={pro.loading}
            deleteLoadingId={deleteLoadingId}
            prevUrl={pro.prevUrl}
            nextUrl={pro.nextUrl}
            onEdit={openEdit}
            onDelete={handleDeleteStudent}
            onPrev={() => pro.fetchStudents(pro.prevUrl!)}
            onNext={() => pro.fetchStudents(pro.nextUrl!)}
          />
        </TabsContent>

        <TabsContent value="public">
          <StudentTable
            students={pub.students}
            loading={pub.loading}
            deleteLoadingId={deleteLoadingId}
            prevUrl={pub.prevUrl}
            nextUrl={pub.nextUrl}
            onEdit={openEdit}
            onDelete={handleDeleteStudent}
            onPrev={() => pub.fetchStudents(pub.prevUrl!)}
            onNext={() => pub.fetchStudents(pub.nextUrl!)}
          />
        </TabsContent>
      </Tabs>

      {modal.open && (
        <StudentModal
          open={modal.open}
          onOpenChange={(open) =>
            setModal({ open, data: open ? modal.data : null })
          }
          onSuccess={() => {
            pro.fetchStudents();
            pub.fetchStudents();
          }}
          initialData={modal.data}
        />
      )}
    </div>
  );
}
