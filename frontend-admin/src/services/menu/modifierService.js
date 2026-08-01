import { adminApi } from "../../config/api";

const modifierService = {
  getModifierGroups: async () => {
    const response = await adminApi.get("/menu/modifier-groups");
    return response.data;
  },

  getModifierGroupById: async (id) => {
    const response = await adminApi.get(`/menu/modifier-groups/${id}`);
    return response.data;
  },

  createModifierGroup: async (groupData) => {
    const response = await adminApi.post("/menu/modifier-groups", groupData);
    return response.data;
  },

  updateModifierGroup: async (id, updateData) => {
    const response = await adminApi.put(`/menu/modifier-groups/${id}`, updateData);
    return response.data;
  },

  deleteModifierGroup: async (id) => {
    const response = await adminApi.delete(`/menu/modifier-groups/${id}`);
    return response.data;
  },

  createModifierOption: async (groupId, optionData) => {
    const response = await adminApi.post(
      `/menu/modifier-groups/${groupId}/options`,
      optionData,
    );
    return response.data;
  },

  updateModifierOption: async (id, updateData) => {
    const response = await adminApi.put(`/menu/modifier-options/${id}`, updateData);
    return response.data;
  },

  deleteModifierOption: async (id) => {
    const response = await adminApi.delete(`/menu/modifier-options/${id}`);
    return response.data;
  },
};

export default modifierService;
