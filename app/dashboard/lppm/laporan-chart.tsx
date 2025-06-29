"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { type ChartConfig } from "@/components/ui/chart"

interface LaporanChartProps {
  data: { month: string; total: number }[];
}

const chartConfig = {
  total: {
    label: "Laporan",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function LaporanChart({ data }: LaporanChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Laporan Tahunan</CardTitle>
        <CardDescription>Jumlah laporan yang dibuat setiap bulan</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
