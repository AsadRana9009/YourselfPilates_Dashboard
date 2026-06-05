"use client";

import { useEffect, useState } from "react";
import swal from "sweetalert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { User, Pack } from "@/types/api";

type AddOrderModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  ownerRole: "pro" | "public"; // "pro" maps to professor/teacher, "public" to student
};

export function AddOrderModal({
  open,
  onOpenChange,
  onSuccess,
  ownerRole,
}: AddOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedPack, setSelectedPack] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("manual");
  const [paymentStatus, setPaymentStatus] = useState<string>("Pago");

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchPacks();
    } else {
      setSelectedUser("");
      setSelectedPack("");
      setPaymentMethod("manual");
      setPaymentStatus("Pago");
    }
  }, [open, ownerRole]);

  const fetchUsers = async () => {
    try {
      // For "pro" we fetch professors, for "public" we fetch students
      const roleQuery = ownerRole === "pro" ? "professor" : "student";
      const res: any = await apiFetch(`/user/users/?role=${roleQuery}&show_all=true`);
      if (res.results) {
        setUsers(res.results);
      } else if (Array.isArray(res)) {
        setUsers(res);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const fetchPacks = async () => {
    try {
      const res: any = await apiFetch(`/subscriptions/packs/?show_all=true`);
      if (res.results) {
        // filter packs by role if needed
        const filteredPacks = res.results.filter((pack: Pack) => 
          ownerRole === "pro" ? pack.target_role === "professor" : pack.target_role === "student"
        );
        setPacks(filteredPacks);
      } else if (Array.isArray(res)) {
        const filteredPacks = res.filter((pack: Pack) => 
          ownerRole === "pro" ? pack.target_role === "professor" : pack.target_role === "student"
        );
        setPacks(filteredPacks);
      }
    } catch (error) {
      console.error("Failed to fetch packs", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedPack) {
      swal("Error", "Please select both a user and a pack.", "error");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/subscriptions/orders/admin_create/", {
        method: "POST",
        body: JSON.stringify({
          user_id: selectedUser,
          pack_id: selectedPack,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
        }),
      });
      swal("Success", "Order created successfully!", "success");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      swal("Error", error.message || "Failed to create order.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {ownerRole === "pro" ? "Pro" : "Public"} Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <select
              id="user"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
            >
              <option value="" disabled>Select User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pack">Pack</Label>
            <select
              id="pack"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={selectedPack}
              onChange={(e) => setSelectedPack(e.target.value)}
              required
            >
              <option value="" disabled>Select Pack</option>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} - €{p.price} ({p.total_hours} hrs)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <select
              id="payment_method"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="manual">Manual/Offline</option>
              <option value="multibanco">MultiBanco</option>
              <option value="mbway">MB WAY</option>
              <option value="creditcard">Credit Card</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_status">Payment Status</Label>
            <select
              id="payment_status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="Pago">Pago (Paid)</option>
              <option value="Pendente">Pendente (Pending)</option>
              <option value="Cancelado">Cancelado (Canceled)</option>
            </select>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
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
