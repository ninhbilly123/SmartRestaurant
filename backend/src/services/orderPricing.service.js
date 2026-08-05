import { Op } from "sequelize";
import db from "../models/index.js";

export const CLOSED_ORDER_STATUSES = [
  "completed",
  "cancelled",
  "payment_request",
  "payment_pending",
];

export const createServiceError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const getModifierOptionId = (modifier) =>
  typeof modifier === "string"
    ? modifier
    : modifier?.modifier_option_id ||
      modifier?.modifierOptionId ||
      modifier?.option_id ||
      modifier?.optionId ||
      modifier?.id ||
      modifier?.modifier_option?.id ||
      modifier?.option?.id;

const getMenuItemId = (itemData) => itemData?.menu_item_id || itemData?.id;

const validateModifierSelectionRules = (allowedGroups, options) => {
  const selectedCountByGroup = options.reduce((acc, option) => {
    acc[option.group_id] = (acc[option.group_id] || 0) + 1;
    return acc;
  }, {});

  for (const group of allowedGroups) {
    const selectedCount = selectedCountByGroup[group.id] || 0;
    const minSelections = Number(group.min_selections || 0);
    const maxSelections = Number(group.max_selections || 0);

    if (group.is_required && selectedCount < Math.max(1, minSelections)) {
      throw createServiceError(`Vui long chon modifier bat buoc: ${group.name}`);
    }

    if (group.selection_type === "single" && selectedCount > 1) {
      throw createServiceError(`Chi duoc chon 1 tuy chon cho modifier: ${group.name}`);
    }

    if (maxSelections > 0 && selectedCount > maxSelections) {
      throw createServiceError(
        `Chi duoc chon toi da ${maxSelections} tuy chon cho modifier: ${group.name}`,
      );
    }
  }
};

export const loadAndValidateModifierOptions = async (
  menuItemId,
  rawModifiers = [],
  transaction,
) => {
  const allowedGroups = await db.ModifierGroup.findAll({
    include: [
      {
        model: db.MenuItem,
        as: "menuItems",
        where: { id: menuItemId },
        attributes: [],
        through: { attributes: [] },
        required: true,
      },
    ],
    where: { status: "active" },
    transaction,
  });

  if (!Array.isArray(rawModifiers) || rawModifiers.length === 0) {
    validateModifierSelectionRules(allowedGroups, []);
    return [];
  }

  const optionIds = rawModifiers.map(getModifierOptionId).filter(Boolean);
  if (optionIds.length !== rawModifiers.length) {
    throw createServiceError("Modifier khong hop le");
  }

  const uniqueOptionIds = [...new Set(optionIds)];
  if (uniqueOptionIds.length !== optionIds.length) {
    throw createServiceError("Khong duoc chon trung modifier");
  }

  const allowedGroupIds = allowedGroups.map((group) => group.id);
  const options = await db.ModifierOption.findAll({
    where: {
      id: { [Op.in]: uniqueOptionIds },
      group_id: { [Op.in]: allowedGroupIds },
      status: "active",
    },
    transaction,
  });

  if (options.length !== uniqueOptionIds.length) {
    throw createServiceError("Modifier khong ton tai hoac khong thuoc mon nay");
  }

  validateModifierSelectionRules(allowedGroups, options);
  return options;
};

export const createPricedOrderItem = async ({
  itemData,
  orderId,
  transaction,
}) => {
  const menuItemId = getMenuItemId(itemData);
  const quantity = Number(itemData?.quantity || 1);

  if (!menuItemId) {
    throw createServiceError("Thieu ma mon an");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw createServiceError("So luong mon phai la so nguyen duong");
  }

  const menuItem = await db.MenuItem.findByPk(menuItemId, { transaction });
  if (!menuItem) {
    throw createServiceError(`Mon an ID ${menuItemId} khong ton tai`, 404);
  }

  if (menuItem.status !== "available") {
    throw createServiceError(`Mon ${menuItem.name} hien khong san sang phuc vu`);
  }

  const selectedOptions = await loadAndValidateModifierOptions(
    menuItemId,
    itemData?.modifiers,
    transaction,
  );

  const itemPrice = Number(menuItem.price);
  const modifiersTotal = selectedOptions.reduce(
    (sum, option) => sum + Number(option.price_adjustment || 0),
    0,
  );

  const orderItem = await db.OrderItem.create(
    {
      order_id: orderId,
      menu_item_id: menuItemId,
      quantity,
      price_at_order: itemPrice,
      notes: itemData?.notes || null,
      status: "pending",
    },
    { transaction },
  );

  if (selectedOptions.length > 0) {
    await db.OrderItemModifier.bulkCreate(
      selectedOptions.map((option) => ({
        order_item_id: orderItem.id,
        modifier_option_id: option.id,
        price: Number(option.price_adjustment || 0),
      })),
      { transaction },
    );
  }

  return {
    orderItem,
    lineTotal: (itemPrice + modifiersTotal) * quantity,
  };
};
