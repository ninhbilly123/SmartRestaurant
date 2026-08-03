import logger from "../../config/logger.js";
import reviewService from "../../services/review.service.js";

const getCustomerId = (req) => req.customer?.uid || req.user?.uid || null;

const handleError = (res, error, fallback) => {
  return res.status(error.status || 500).json({
    success: false,
    error: error.message || fallback,
  });
};

export const createReview = async (req, res) => {
  try {
    const review = await reviewService.createReview({
      comment: req.body.comment,
      customerId: getCustomerId(req),
      customerName:
        req.body.customer_name || req.customer?.full_name || "Anonymous",
      menuItemId: req.body.menu_item_id,
      orderId: req.body.order_id,
      rating: req.body.rating,
    });

    return res.status(201).json({
      success: true,
      data: review,
      message: "Review created successfully",
    });
  } catch (error) {
    logger.error("Create review error:", error);
    return handleError(res, error, "Failed to create review");
  }
};

export const getMenuItemReviews = async (req, res) => {
  try {
    const data = await reviewService.getMenuItemReviews({
      menuItemId: req.params.menuItemId,
      ...req.query,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Get reviews error:", error);
    return handleError(res, error, "Failed to get reviews");
  }
};

export const getReviewableItems = async (req, res) => {
  try {
    const data = await reviewService.getReviewableItems({
      customerId: getCustomerId(req),
      orderId: req.params.orderId,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("Get reviewable items error:", error);
    return handleError(res, error, "Failed to get reviewable items");
  }
};

export const updateReview = async (req, res) => {
  try {
    const review = await reviewService.updateReview({
      comment: req.body.comment,
      customerId: getCustomerId(req),
      id: req.params.id,
      rating: req.body.rating,
    });

    return res.status(200).json({
      success: true,
      data: review,
      message: "Review updated successfully",
    });
  } catch (error) {
    logger.error("Update review error:", error);
    return handleError(res, error, "Failed to update review");
  }
};

export const deleteReview = async (req, res) => {
  try {
    await reviewService.deleteReview({
      customerId: getCustomerId(req),
      id: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    logger.error("Delete review error:", error);
    return handleError(res, error, "Failed to delete review");
  }
};
