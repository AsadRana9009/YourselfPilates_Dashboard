"use client";

import { MapPinIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import swal from "sweetalert";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableLoader } from "@/components/ui/TableLoader";
import { deleteRegion, getRegions } from "@/lib/apiActions";
import type { Region } from "@/types/api";

import { RegionModal } from "./RegionModal";

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; data: Region | null }>({
    open: false,
    data: null,
  });

  async function fetchRegions() {
    setLoading(true);
    try {
      setRegions(await getRegions());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRegions();
  }, []);

  const openCreate = () => setModal({ open: true, data: null });
  const openEdit = (region: Region) => setModal({ open: true, data: region });

  const handleDelete = async (region: Region) => {
    const confirmed = await swal({
      title: "Delete region?",
      text: `"${region.name}" will be permanently removed.`,
      icon: "warning",
      buttons: ["Cancel", "Delete"],
      dangerMode: true,
    });
    if (!confirmed) return;
    try {
      await deleteRegion(region.id);
      swal({ title: "Deleted!", text: "Region removed.", icon: "success" });
      fetchRegions();
    } catch (err) {
      swal({
        title: "Error",
        text: (err as Error).message || "Delete failed",
        icon: "error",
      });
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-6 h-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Regions</h2>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="w-4 h-4 mr-2" /> Add Region
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Manage gym locations (e.g. Porto, Lisbon). Each pack can have a distinct
        price per region.
      </p>

      {loading ? (
        <TableLoader />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No regions yet. Click &quot;Add Region&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {region.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        region.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {region.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(region.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(region)}
                      >
                        <PencilIcon className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                        onClick={() => handleDelete(region)}
                      >
                        <Trash2Icon className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <RegionModal
        open={modal.open}
        onOpenChange={(open) =>
          setModal({ open, data: open ? modal.data : null })
        }
        onSuccess={fetchRegions}
        initialData={modal.data}
      />
    </div>
  );
}
