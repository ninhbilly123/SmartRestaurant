import React from "react";
import { Calendar } from "lucide-react";

const ReportDateFilter = ({ dateRange, onChange, onSubmit }) => {
  return (
    <div className="bg-white p-2 rounded-lg shadow-sm border flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-2 px-2">
        <Calendar size={18} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Từ:</span>
        <input
          className="border-none outline-none text-sm text-gray-600 bg-transparent"
          name="fromDate"
          onChange={onChange}
          type="date"
          value={dateRange.fromDate}
        />
      </div>
      <div className="hidden sm:block w-px h-6 bg-gray-200" />
      <div className="flex items-center gap-2 px-2">
        <span className="text-sm font-medium text-gray-700">Đến:</span>
        <input
          className="border-none outline-none text-sm text-gray-600 bg-transparent"
          name="toDate"
          onChange={onChange}
          type="date"
          value={dateRange.toDate}
        />
      </div>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
        onClick={onSubmit}
      >
        Lọc dữ liệu
      </button>
    </div>
  );
};

export default ReportDateFilter;
