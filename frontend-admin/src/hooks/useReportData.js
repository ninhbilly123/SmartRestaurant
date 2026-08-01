import { useCallback, useEffect, useState } from "react";
import reportService from "../services/reportService";
import { buildFullDayPeakHours, getDefaultDateRange } from "../utils/reportData";

const useReportData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, activeTables: 0 });
  const [revenueData, setRevenueData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, topItemsRes, peakHoursRes] =
        await Promise.all([
          reportService.getDashboardStats(),
          reportService.getRevenueChart(dateRange.fromDate, dateRange.toDate),
          reportService.getTopItems(dateRange.fromDate, dateRange.toDate),
          reportService.getPeakHours(),
        ]);

      if (statsRes.success) setStats(statsRes.data);
      if (revenueRes.success) setRevenueData(revenueRes.data);
      if (topItemsRes.success) setTopItems(topItemsRes.data);
      if (peakHoursRes.success) setPeakHours(buildFullDayPeakHours(peakHoursRes.data));
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.fromDate, dateRange.toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = useCallback((e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  }, []);

  return {
    dateRange,
    fetchData,
    handleDateChange,
    loading,
    peakHours,
    revenueData,
    stats,
    topItems,
  };
};

export default useReportData;
