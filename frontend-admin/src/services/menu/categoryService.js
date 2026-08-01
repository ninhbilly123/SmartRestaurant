import { adminApi } from "../../config/api";

const categoryService = {
  getCategories: async () => {
    const response = await adminApi.get("/menu/categories", {
      params: {
        include_items: true,
      },
    });
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await adminApi.post("/menu/categories", categoryData);
    return response.data;
  },

  updateCategory: async (id, updateData) => {
    const response = await adminApi.put(`/menu/categories/${id}`, updateData);
    return response.data;
  },

  updateCategoryStatus: async (id, status) => {
    const response = await adminApi.patch(`/menu/categories/${id}/status`, {
      status,
    });
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await adminApi.patch(`/menu/categories/${id}/delete`);
    return response.data;
  },
};

export default categoryService;
