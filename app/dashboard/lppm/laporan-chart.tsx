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

// Diperbarui: Tipe data untuk aktivitas harian
interface LaporanHarianChartProps {
  data: { date: string; total: number }[];
}

const chartConfig = {
  total: {
    label: "Laporan",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function LaporanHarianChart({ data }: LaporanHarianChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Laporan Harian</CardTitle>
        <CardDescription>Jumlah laporan yang dibuat dalam 30 hari terakhir</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              // Diperbarui: Formatter untuk menampilkan tanggal saja
              tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
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
