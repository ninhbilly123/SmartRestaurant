import sequelize from "../config/database.js";
import MenuItem from "../models/menuItem.js";
import MenuItemReview from "../models/menuItemReview.js";
import Order from "../models/order.js";
import OrderItem from "../models/orderItem.js";

const getReviewOrder = (sort) => {
  switch (sort) {
    case "highest":
      return [
        ["rating", "DESC"],
        ["created_at", "DESC"],
      ];
    case "lowest":
      return [
        ["rating", "ASC"],
        ["created_at", "DESC"],
      ];
    case "oldest":
      return [["created_at", "ASC"]];
    case "recent":
    default:
      return [["created_at", "DESC"]];
  }
};

const assertRating = (rating) => {
  if (!rating) {
    const error = new Error("Menu item ID and rating are required");
    error.status = 400;
    throw error;
  }

  if (rating < 1 || rating > 5) {
    const error = new Error("Rating must be between 1 and 5");
    error.status = 400;
    throw error;
  }
};

export const createReview = async ({
  comment,
  customerId,
  customerName,
  menuItemId,
  orderId,
  rating,
}) => {
  if (!menuItemId) {
    const error = new Error("Menu item ID and rating are required");
    error.status = 400;
    throw error;
  }
  assertRating(rating);

  if (!orderId) {
    const error = new Error("Order ID is required to verify your purchase");
    error.status = 400;
    throw error;
  }

  const whereClause = { id: orderId };
  if (customerId) whereClause.customer_id = customerId;

  const order = await Order.findOne({ where: whereClause });
  if (!order) {
    const error = new Error("Invalid order or you do not own this order");
    error.status = 403;
    throw error;
  }

  if (order.status !== "completed") {
    const error = new Error("Only completed orders can be reviewed");
    error.status = 400;
    throw error;
  }

  const orderItem = await OrderItem.findOne({
    where: {
      order_id: orderId,
      menu_item_id: menuItemId,
    },
  });

  if (!orderItem) {
    const error = new Error("You did not order this item in the specified order");
    error.status = 400;
    throw error;
  }

  const existingReview = await MenuItemReview.findOne({
    where: {
      customer_id: customerId,
      order_id: orderId,
      menu_item_id: menuItemId,
    },
  });

  if (existingReview) {
    const error = new Error("You have already reviewed this item from this order");
    error.status = 409;
    throw error;
  }

  const menuItem = await MenuItem.findByPk(menuItemId);
  if (!menuItem) {
    const error = new Error("Menu item not found");
    error.status = 404;
    throw error;
  }

  return MenuItemReview.create({
    menu_item_id: menuItemId,
    customer_id: customerId,
    order_id: orderId,
    rating,
    comment: comment || null,
    customer_name: customerName || "Anonymous",
    is_verified_purchase: true,
    is_approved: true,
  });
};

export const getMenuItemReviews = async ({
  menuItemId,
  page = 1,
  limit = 10,
  sort = "recent",
}) => {
  const normalizedPage = parseInt(page, 10);
  const normalizedLimit = parseInt(limit, 10);
  const offset = (normalizedPage - 1) * normalizedLimit;

  const { count, rows: reviews } = await MenuItemReview.findAndCountAll({
    where: {
      menu_item_id: menuItemId,
      is_approved: true,
    },
    order: getReviewOrder(sort),
    limit: normalizedLimit,
    offset,
    attributes: {
      exclude: ["is_approved"],
    },
  });

  const stats = await MenuItemReview.findOne({
    where: {
      menu_item_id: menuItemId,
      is_approved: true,
    },
    attributes: [
      [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
      [sequelize.fn("COUNT", sequelize.col("id")), "total_reviews"],
      [
        sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 5 THEN 1 END")),
        "five_star",
      ],
      [
        sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 4 THEN 1 END")),
        "four_star",
      ],
      [
        sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 3 THEN 1 END")),
        "three_star",
      ],
      [
        sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 2 THEN 1 END")),
        "two_star",
      ],
      [
        sequelize.fn("COUNT", sequelize.literal("CASE WHEN rating = 1 THEN 1 END")),
        "one_star",
      ],
    ],
    raw: true,
  });

  return {
    reviews,
    stats: {
      average_rating: parseFloat(stats.average_rating || 0).toFixed(1),
      total_reviews: parseInt(stats.total_reviews || 0, 10),
      rating_distribution: {
        5: parseInt(stats.five_star || 0, 10),
        4: parseInt(stats.four_star || 0, 10),
        3: parseInt(stats.three_star || 0, 10),
        2: parseInt(stats.two_star || 0, 10),
        1: parseInt(stats.one_star || 0, 10),
      },
    },
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total: count,
      totalPages: Math.ceil(count / normalizedLimit),
    },
  };
};

export const getReviewableItems = async ({ customerId, orderId }) => {
  const order = await Order.findByPk(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  if (order.status !== "completed") {
    return {
      order_id: orderId,
      reviewable_items: [],
      already_reviewed: 0,
      total_items: 0,
    };
  }

  const orderItems = await OrderItem.findAll({
    where: { order_id: orderId },
    include: [
      {
        model: MenuItem,
        as: "menu_item",
        attributes: ["id", "name", "price"],
      },
    ],
  });

  if (orderItems.length === 0) {
    const error = new Error("Order not found or has no items");
    error.status = 404;
    throw error;
  }

  const existingReviews = await MenuItemReview.findAll({
    where: {
      order_id: orderId,
      ...(customerId && { customer_id: customerId }),
    },
    attributes: ["menu_item_id"],
  });

  const reviewedItemIds = existingReviews.map((review) => review.menu_item_id);
  const reviewableItems = orderItems
    .filter((item) => !reviewedItemIds.includes(item.menu_item_id))
    .map((item) => ({
      order_item_id: item.id,
      menu_item_id: item.menu_item_id,
      name: item.menu_item.name,
      quantity: item.quantity,
      price: item.menu_item.price,
      can_review: true,
    }));

  return {
    order_id: orderId,
    reviewable_items: reviewableItems,
    already_reviewed: orderItems.length - reviewableItems.length,
    total_items: orderItems.length,
  };
};

export const updateReview = async ({ customerId, id, rating, comment }) => {
  const review = await MenuItemReview.findByPk(id);
  if (!review) {
    const error = new Error("Review not found");
    error.status = 404;
    throw error;
  }

  if (customerId && review.customer_id !== customerId) {
    const error = new Error("You can only edit your own reviews");
    error.status = 403;
    throw error;
  }

  if (rating !== undefined) {
    assertRating(rating);
    review.rating = rating;
  }

  if (comment !== undefined) {
    review.comment = comment;
  }

  review.updated_at = new Date();
  await review.save();
  return review;
};

export const deleteReview = async ({ customerId, id }) => {
  const review = await MenuItemReview.findByPk(id);
  if (!review) {
    const error = new Error("Review not found");
    error.status = 404;
    throw error;
  }

  if (customerId && review.customer_id !== customerId) {
    const error = new Error("You can only delete your own reviews");
    error.status = 403;
    throw error;
  }

  await review.destroy();
};

export default {
  createReview,
  getMenuItemReviews,
  getReviewableItems,
  updateReview,
  deleteReview,
};
