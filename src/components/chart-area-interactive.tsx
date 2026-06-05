"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnalyticsData, getAnalytics } from "@/lib/apiActions";

export const description = "An interactive area chart";

const chartConfig = {
  teacher: {
    label: "Professor",
    color: "var(--primary)",
  },
  student: {
    label: "Aluno",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch analytics for chart:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const processedData = React.useMemo(() => {
    if (!analytics) return [];

    let teachers = [];
    let students = [];

    if (timeRange === "90d") {
      teachers = analytics.teacher_visitors.last_3_months;
      students = analytics.student_visitors.last_3_months;
    } else if (timeRange === "30d") {
      teachers = analytics.teacher_visitors.last_30_days;
      students = analytics.student_visitors.last_30_days;
    } else {
      teachers = analytics.teacher_visitors.last_7_days;
      students = analytics.student_visitors.last_7_days;
    }

    // Merge data by date
    return teachers.map((item, index) => ({
      date: item.date,
      teacher: item.count,
      student: students[index]?.count || 0,
    }));
  }, [analytics, timeRange]);

  if (loading) {
    return (
      <Card className="@container/card animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </CardHeader>
        <CardContent className="h-[250px] bg-muted/20 rounded-b-lg m-4"></CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription>
          Showing visitors for the{" "}
          {timeRange === "90d"
            ? "last 3 months"
            : timeRange === "30d"
              ? "last 30 days"
              : "last 7 days"}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(val) => val && setTimeRange(val)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(val) => val && setTimeRange(val)}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden cursor-pointer"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg cursor-pointer">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg cursor-pointer">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg cursor-pointer">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={processedData}>
            <defs>
              <linearGradient id="fillTeacher" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-teacher)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-teacher)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillStudent" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-student)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-student)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="student"
              type="natural"
              fill="url(#fillStudent)"
              stroke="var(--color-student)"
              stackId="a"
            />
            <Area
              dataKey="teacher"
              type="natural"
              fill="url(#fillTeacher)"
              stroke="var(--color-teacher)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
