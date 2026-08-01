import { adminApi } from "../../config/api";

const buildItemFormData = (itemData, photos) => {
  const formData = new FormData();
  formData.append("itemData", JSON.stringify(itemData));
  photos.forEach((file) => {
    formData.append("photos", file);
  });
  return formData;
};

const menuItemService = {
  getAllItems: async (params = {}) => {
    const response = await adminApi.get("/menu/items", { params });
    return response.data;
  },

  getItemById: async (id) => {
    const response = await adminApi.get(`/menu/items/${id}`);
    return response.data;
  },

  createItem: async (itemData, photos = []) => {
    if (photos.length > 0) {
      const response = await adminApi.post(
        "/menu/items",
        buildItemFormData(itemData, photos),
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    }

    const response = await adminApi.post("/menu/items", itemData);
    return response.data;
  },

  updateItem: async (id, updateData) => {
    const response = await adminApi.put(`/menu/items/${id}`, updateData);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await adminApi.delete(`/menu/items/${id}`);
    return response.data;
  },

  attachModifierGroups: async (itemId, groupIds) => {
    const response = await adminApi.post(`/menu/items/${itemId}/modifier-groups`, {
      groupIds,
    });
    return response.data;
  },
};

export default menuItemService;
