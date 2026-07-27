"use client"

import { Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { type ChartConfig } from "@/components/ui/chart"

interface StatusLaporanChartProps {
  data: { status: string; total: number; fill: string }[];
}

const chartConfig = {
  total: { label: "Laporan" },
  disetujui: { label: "Disetujui", color: "hsl(var(--chart-2))" },
  menunggu: { label: "Menunggu Persetujuan", color: "hsl(var(--chart-4))" },
  revisi: { label: "Perlu Revisi", color: "hsl(var(--chart-5))" },
  draft: { label: "Draft", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function StatusLaporanChart({ data }: StatusLaporanChartProps) {
  const isEmpty = data.every((d) => d.total === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sebaran Status Laporan</CardTitle>
        <CardDescription>Proporsi status dari seluruh laporan yang pernah Anda buat</CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            Belum ada laporan untuk ditampilkan.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto min-h-[200px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Pie data={data} dataKey="total" nameKey="status" innerRadius={50} strokeWidth={4} />
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
