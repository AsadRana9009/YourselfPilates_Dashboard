"use client";

import React, { useEffect, useState } from "react";
import swal from "sweetalert";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { getRegions } from "@/lib/apiActions";
import type { Pack, Region, User } from "@/types/api";

type AddOrderModalProps = {
  open: boolean;
  onOpenChange: (_value: boolean) => void;
  onSuccess: () => void;
  ownerRole: "pro" | "public";
};

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

export function AddOrderModal({
  open,
  onOpenChange,
  onSuccess,
  ownerRole,
}: AddOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPack, setSelectedPack] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [paymentStatus, setPaymentStatus] = useState("Pago");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const roleQuery = ownerRole === "pro" ? "professor" : "student";
        const res = await apiFetch(
          `/user/users/?role=${roleQuery}&show_all=true`
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = res as any;
        setUsers((data.results ?? (Array.isArray(data) ? data : [])) as User[]);
      } catch {
        setUsers([]);
      }
    };

    const fetchPacks = async () => {
      try {
        const res = await apiFetch("/subscriptions/packs/?show_all=true");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = res as any;
        const all: Pack[] = (d.results ??
          (Array.isArray(d) ? d : [])) as Pack[];
        setPacks(
          all.filter((p) =>
            ownerRole === "pro"
              ? p.target_role === "professor"
              : p.target_role === "student"
          )
        );
      } catch {
        setPacks([]);
      }
    };

    if (open) {
      fetchUsers();
      fetchPacks();
      getRegions()
        .then(setRegions)
        .catch(() => setRegions([]));
    } else {
      setSelectedUser("");
      setSelectedPack("");
      setSelectedRegion("");
      setPaymentMethod("manual");
      setPaymentStatus("Pago");
    }
  }, [open, ownerRole]);

  // Find the selected pack to show region-specific price hint
  const activePack = packs.find((p) => String(p.id) === selectedPack);
  const regionPrice = activePack?.region_prices?.find(
    (rp) => String(rp.region) === selectedRegion
  );
  const effectivePrice = regionPrice
    ? regionPrice.price
    : (activePack?.price ?? null);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
          ...(selectedRegion ? { region_id: Number(selectedRegion) } : {}),
        }),
      });
      swal("Success", "Order created successfully!", "success");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      swal(
        "Error",
        (error as Error).message || "Failed to create order.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add {ownerRole === "pro" ? "Pro" : "Public"} Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User */}
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <select
              id="user"
              className={SELECT_CLASS}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
            >
              <option value="" disabled>
                Select User
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Pack */}
          <div className="space-y-2">
            <Label htmlFor="pack">Pack</Label>
            <select
              id="pack"
              className={SELECT_CLASS}
              value={selectedPack}
              onChange={(e) => {
                setSelectedPack(e.target.value);
                setSelectedRegion("");
              }}
              required
            >
              <option value="" disabled>
                Select Pack
              </option>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — €{parseFloat(p.price).toFixed(2)} ({p.total_hours}{" "}
                  hrs)
                </option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region">
              Region{" "}
              <span className="text-muted-foreground text-xs font-normal">
                (optional)
              </span>
            </Label>
            <select
              id="region"
              className={SELECT_CLASS}
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="">No specific region</option>
              {regions
                .filter((r) => r.is_active)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
            {effectivePrice && (
              <p className="text-xs text-muted-foreground">
                Price for this order:{" "}
                <span className="font-medium text-foreground">
                  €{parseFloat(effectivePrice).toFixed(2)}
                </span>
                {regionPrice && (
                  <span className="ml-1 text-green-600 dark:text-green-400">
                    (regional rate)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <select
              id="payment_method"
              className={SELECT_CLASS}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="manual">Manual/Offline</option>
              <option value="multibanco">MultiBanco</option>
              <option value="mbway">MB WAY</option>
              <option value="creditcard">Credit Card</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label htmlFor="payment_status">Payment Status</Label>
            <select
              id="payment_status"
              className={SELECT_CLASS}
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="Pago">Pago (Paid)</option>
              <option value="Pendente">Pendente (Pending)</option>
              <option value="Cancelado">Cancelado (Canceled)</option>
            </select>
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
