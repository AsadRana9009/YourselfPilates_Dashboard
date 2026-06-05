"use client";
import { IconTrendingUp } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { AnalyticsData, getAnalytics } from "@/lib/apiActions";

import { Badge } from "./ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

export function SectionCards() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError("Failed to load analytics");
        // eslint-disable-next-line no-console
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="px-4 lg:px-6">
        <div className="text-center text-muted-foreground py-8">
          {error || "Failed to load analytics"}
        </div>
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Bookings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {analytics.total_bookings}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {analytics.confirmed_last_7_days} this week
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {analytics.confirmed_last_30_days} confirmed this month{" "}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {analytics.confirmed_bookings} confirmed,{" "}
            {analytics.cancelled_bookings} canceled
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Teachers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {analytics.total_teachers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {analytics.total_teachers} registered teachers{" "}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Available for bookings</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Students</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {analytics.total_students}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Registered
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {analytics.total_students} active students{" "}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Enrolled in classes</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Confirmed Bookings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {analytics.confirmed_bookings}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {analytics.confirmed_last_3_months} in 3 months
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {analytics.confirmed_last_30_days} confirmed this month{" "}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {analytics.confirmed_last_7_days} in last 7 days
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
