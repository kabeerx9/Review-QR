"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface RatingTrendPoint {
  date: string;
  avg: number;
  count: number;
}

interface RatingTrendChartProps {
  data: RatingTrendPoint[];
}

export default function RatingTrendChart({ data }: RatingTrendChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 4 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              backgroundColor: "#fff",
              fontSize: 12,
            }}
            labelFormatter={(value) =>
              `Week of ${new Date(String(value)).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
            }
            formatter={(value, name) => {
              const numericValue = typeof value === "number" ? value : Number(value ?? 0);
              return name === "avg"
                ? [`${numericValue.toFixed(2)} / 5`, "Average Rating"]
                : [numericValue, "Review Count"];
            }}
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
