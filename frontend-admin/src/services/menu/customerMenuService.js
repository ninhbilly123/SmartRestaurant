import { publicApi } from "../../config/api";

const customerMenuService = {
  getActiveMenu: async (restaurantId) => {
    const response = await publicApi.get("/menu/items", {
      params: {
        restaurant_id: restaurantId,
        status: "available",
      },
    });
    return response.data;
  },

  getItemsByCategory: async (categoryId, params = {}) => {
    const response = await publicApi.get("/menu/items", {
      params: {
        category_id: categoryId,
        status: "available",
        ...params,
      },
    });
    return response.data;
  },

  searchItems: async (restaurantId, searchTerm, options = {}) => {
    const response = await publicApi.get("/menu/items", {
      params: {
        restaurant_id: restaurantId,
        search: searchTerm,
        ...options,
      },
    });
    return response.data;
  },
};

export default customerMenuService;
