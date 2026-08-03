import React from "react";
import ReportDateFilter from "./ReportDateFilter";

const ReportHeader = ({ dateRange, onDateChange, onFilter }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Báo cáo doanh thu
        </h1>
        <p className="text-gray-500">
          Theo dõi hiệu quả kinh doanh và xu hướng
        </p>
      </div>

      <ReportDateFilter
        dateRange={dateRange}
        onChange={onDateChange}
        onSubmit={onFilter}
      />
    </div>
  );
};

export default ReportHeader;
