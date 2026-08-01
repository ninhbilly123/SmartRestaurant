import { adminApi } from "../../config/api";

const buildPhotoFormData = (files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("photos", file);
  });
  return formData;
};

const menuPhotoService = {
  uploadPhotos: async (itemId, files) => {
    const response = await adminApi.post(
      `/menu/items/${itemId}/photos`,
      buildPhotoFormData(files),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  deletePhoto: async (itemId, photoId) => {
    const response = await adminApi.delete(`/menu/items/${itemId}/photos/${photoId}`);
    return response.data;
  },

  setPrimaryPhoto: async (itemId, photoId) => {
    const response = await adminApi.patch(
      `/menu/items/${itemId}/photos/${photoId}/primary`,
    );
    return response.data;
  },

  getItemPhotos: async (itemId) => {
    const response = await adminApi.get(`/menu/items/${itemId}/photos`);
    return response.data;
  },
};

export default menuPhotoService;
