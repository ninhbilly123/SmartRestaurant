import React from "react";
import Loading from "../../components/common/Loading";
import {
  PeakHoursChart,
  ReportHeader,
  ReportStatsGrid,
  RevenueChart,
  TopItemsChart,
} from "../../components/admin/reports";
import useReportData from "../../hooks/useReportData";

const ReportPage = () => {
  const {
    dateRange,
    fetchData,
    handleDateChange,
    loading,
    peakHours,
    revenueData,
    stats,
    topItems,
  } = useReportData();

  if (loading) return <Loading />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ReportHeader
        dateRange={dateRange}
        onDateChange={handleDateChange}
        onFilter={fetchData}
      />

      <ReportStatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <RevenueChart data={revenueData} />
        <TopItemsChart data={topItems} />
      </div>

      <PeakHoursChart data={peakHours} />
    </div>
  );
};

export default ReportPage;
