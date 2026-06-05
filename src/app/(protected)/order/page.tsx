/* eslint-disable no-console */
"use client";

import { PlusIcon, ShieldCheckIcon, UserCheckIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders } from "@/lib/apiActions";
import { Order } from "@/types/api";
import { AddOrderModal } from "./AddOrderModal";

/** DRF often omits `?page=1` on the first page — treat missing `page` as page 1. */
function getPageFromUrl(url: string | null): number | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const p = u.searchParams.get("page");
    if (!p) return 1;
    const n = Number(p);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function useOrders(ownerRole: "pro" | "student") {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [effectivePageSize, setEffectivePageSize] = useState<number>(5);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await getOrders({ page: currentPage, ownerRole });
        const results = data.results || [];

        setOrders(results);
        setTotalCount(data.count ?? 0);
        setNextUrl(data.next ?? null);
        setPrevUrl(data.previous ?? null);

        if (results.length > 0 && (data.next || currentPage === 1)) {
          setEffectivePageSize(results.length);
        }

        const prevPage = getPageFromUrl(data.previous ?? null);
        const nextPage = getPageFromUrl(data.next ?? null);
        const derivedCurrent =
          prevPage !== null
            ? prevPage + 1
            : nextPage !== null
              ? nextPage - 1
              : 1;
        if (derivedCurrent !== currentPage) setCurrentPage(derivedCurrent);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setOrders([]);
        setTotalCount(0);
        setNextUrl(null);
        setPrevUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, ownerRole]);

  const totalPages = Math.max(1, Math.ceil(totalCount / effectivePageSize));

  const handlePrevPage = () => {
    if (!prevUrl) return;
    const target = getPageFromUrl(prevUrl);
    if (!target) return;
    setCurrentPage(target);
  };

  const handleNextPage = () => {
    if (!nextUrl) return;
    const target = getPageFromUrl(nextUrl);
    if (!target) return;
    setCurrentPage(target);
  };

  return {
    orders,
    loading,
    currentPage,
    totalPages,
    nextUrl,
    prevUrl,
    handlePrevPage,
    handleNextPage,
  };
}

function OrdersTable({
  orders,
  loading,
  currentPage,
  totalPages,
  prevUrl,
  nextUrl,
  onPrev,
  onNext,
}: {
  orders: Order[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  prevUrl: string | null;
  nextUrl: string | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (loading) {
    return <p>Loading...</p>;
  }

  if (orders.length === 0) {
    return <p>No orders found.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Package Title</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Created_at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.user_name}</TableCell>
              <TableCell>{order.user_email}</TableCell>
              <TableCell>{order.pack_details.title}</TableCell>
              <TableCell>{order.pack_details.total_hours}</TableCell>
              <TableCell>€{parseFloat(order.amount).toFixed(2)}</TableCell>
              <TableCell className="capitalize">
                {order.payment_method}
              </TableCell>
              <TableCell>{order.payment_status}</TableCell>
              <TableCell>
                {new Date(order.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <Button
            onClick={onPrev}
            disabled={loading || !prevUrl}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={onNext}
            disabled={loading || !nextUrl}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

const OrdersPage = () => {
  const pro = useOrders("pro");
  const pub = useOrders("student");
  const [activeTab, setActiveTab] = useState<"pro" | "public">("pro");
  const [modalOpen, setModalOpen] = useState(false);

  const handleOrderSuccess = () => {
    if (activeTab === "pro") {
      pro.handleNextPage(); // trigger a re-fetch by resetting to page 1
    } else {
      pub.handleNextPage();
    }
    // Simple workaround: reload both by resetting page state via page navigation
    window.location.reload();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4 pt-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Button onClick={() => setModalOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Order
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "pro" | "public")}
        className="mb-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="pro" className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" />
            Pro Orders
            {!pro.loading && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({pro.orders.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <UserCheckIcon className="w-4 h-4" />
            Public Orders
            {!pub.loading && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({pub.orders.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pro">
          <OrdersTable
            orders={pro.orders}
            loading={pro.loading}
            currentPage={pro.currentPage}
            totalPages={pro.totalPages}
            prevUrl={pro.prevUrl}
            nextUrl={pro.nextUrl}
            onPrev={pro.handlePrevPage}
            onNext={pro.handleNextPage}
          />
        </TabsContent>

        <TabsContent value="public">
          <OrdersTable
            orders={pub.orders}
            loading={pub.loading}
            currentPage={pub.currentPage}
            totalPages={pub.totalPages}
            prevUrl={pub.prevUrl}
            nextUrl={pub.nextUrl}
            onPrev={pub.handlePrevPage}
            onNext={pub.handleNextPage}
          />
        </TabsContent>
      </Tabs>

      <AddOrderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleOrderSuccess}
        ownerRole={activeTab}
      />
    </div>
  );
};

export default OrdersPage;
