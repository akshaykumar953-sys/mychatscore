"use client";

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const data = [
  { name: "Start", interest: 50, you: 20, them: 15 },
  { name: "Mid", interest: 65, you: 35, them: 30 },
  { name: "End", interest: 75, you: 55, them: 45 }
];

export default function ConversationGraph() {
  return (
    <div style={{
      width: "100%",
      height: 260,
      marginTop: "20px"
    }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          
          <XAxis 
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip 
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e5e7eb"
            }}
          />

          {/* 🔥 Interest Line */}
          <Line
            type="monotone"
            dataKey="interest"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* 🔥 Your Effort */}
          <Line
            type="monotone"
            dataKey="you"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 4 }}
          />

          {/* 🔥 Their Effort */}
          <Line
            type="monotone"
            dataKey="them"
            stroke="#86efac"
            strokeWidth={3}
            dot={{ r: 4 }}
          />

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
