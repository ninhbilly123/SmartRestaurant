import logger from "../../config/logger.js";
import reportService from "../../services/report.service.js";

export const getDashboardStats = async (req, res) => {
  try {
    const data = await reportService.getDashboardStats();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy thống kê",
    });
  }
};

export const getRevenueChart = async (req, res) => {
  try {
    const data = await reportService.getRevenueChart(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Revenue chart error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy biểu đồ",
    });
  }
};

export const getTopSellingItems = async (req, res) => {
  try {
    const data = await reportService.getTopSellingItems(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Top items error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy top món",
    });
  }
};

export const getPeakHours = async (req, res) => {
  try {
    const data = await reportService.getPeakHours();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Peak hours error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy giờ cao điểm",
    });
  }
};
