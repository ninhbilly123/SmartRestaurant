import sequelize from "../config/database.js";

import Customer from "./customer.js";
import MenuCategory from "./menuCategory.js";
import MenuItem from "./menuItem.js";
import MenuItemModifierGroup from "./menuItemModifierGroup.js";
import MenuItemPhoto from "./menuItemPhoto.js";
import MenuItemReview from "./menuItemReview.js";
import ModifierGroup from "./modifierGroup.js";
import ModifierOption from "./modifierOption.js";
import Order from "./order.js";
import OrderItem from "./orderItem.js";
import OrderItemModifier from "./orderItemModifier.js";
import Table from "./table.js";
import User from "./user.js";
import VerifiedEmail from "./verifiedEmail.js";

const db = {
  sequelize,
  Customer,
  MenuCategory,
  MenuItem,
  MenuItemModifierGroup,
  MenuItemPhoto,
  MenuItemReview,
  ModifierGroup,
  ModifierOption,
  Order,
  OrderItem,
  OrderItemModifier,
  Table,
  User,
  VerifiedEmail,
};

Object.values(db).forEach((model) => {
  if (model?.associate) {
    model.associate(db);
  }
});

export default db;
