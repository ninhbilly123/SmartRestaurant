import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Utensils } from "lucide-react";

const TopItemsChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Utensils size={20} className="text-orange-500" /> Top món bán chạy
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip cursor={{ fill: "transparent" }} formatter={(value) => value} />
            <Bar dataKey="value" fill="#f59e0b" barSize={20} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={index % 2 === 0 ? "#f59e0b" : "#ea580c"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopItemsChart;
