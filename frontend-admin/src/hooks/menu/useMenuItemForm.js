import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  categoryService,
  menuItemService,
  menuPhotoService,
  modifierService,
} from "../../services/menu";

const DEFAULT_FORM_DATA = {
  name: "",
  category_id: "",
  price: "",
  description: "",
  prep_time_minutes: "",
  status: "available",
  is_chef_recommended: false,
};

const useMenuItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [photos, setPhotos] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [primaryPendingPhotoId, setPrimaryPendingPhotoId] = useState(null);
  const [selectedModifierGroups, setSelectedModifierGroups] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    return () => {
      pendingPhotos.forEach((photo) => {
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    };
  }, [pendingPhotos]);

  const fetchInitialData = useCallback(async () => {
    try {
      setFetchLoading(true);
      const [categoriesRes, modifiersRes] = await Promise.all([
        categoryService.getCategories(),
        modifierService.getModifierGroups().catch(() => ({ data: [] })),
      ]);

      setCategories(categoriesRes.data || []);
      setModifierGroups(modifiersRes.data || []);

      if (isEditing) {
        const itemRes = await menuItemService.getItemById(id);
        const item = itemRes.data;

        setFormData({
          name: item.name || "",
          category_id: item.category_id || "",
          price: item.price || "",
          description: item.description || "",
          prep_time_minutes: item.prep_time_minutes || "",
          status: item.status || "available",
          is_chef_recommended: item.is_chef_recommended || false,
        });

        setPhotos(item.photos || []);
        setSelectedModifierGroups(item.modifierGroups?.map((g) => g.id) || []);
      }
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu");
    } finally {
      setFetchLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên món là bắt buộc";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Tên món phải có ít nhất 2 ký tự";
    } else if (formData.name.trim().length > 80) {
      newErrors.name = "Tên món không được vượt quá 80 ký tự";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Danh mục là bắt buộc";
    }

    if (!formData.price) {
      newErrors.price = "Giá là bắt buộc";
    } else if (parseFloat(formData.price) < 0.01) {
      newErrors.price = "Giá phải ít nhất là 0.01";
    } else if (parseFloat(formData.price) > 999999.99) {
      newErrors.price = "Giá không được vượt quá 999,999.99";
    }

    if (formData.prep_time_minutes && parseInt(formData.prep_time_minutes) < 0) {
      newErrors.prep_time_minutes = "Thời gian chuẩn bị không được âm";
    } else if (
      formData.prep_time_minutes &&
      parseInt(formData.prep_time_minutes) > 240
    ) {
      newErrors.prep_time_minutes =
        "Thời gian chuẩn bị không được vượt quá 240 phút";
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Mô tả không được vượt quá 1000 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors],
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      setLoading(true);
      setError(null);

      try {
        const dataToSubmit = {
          ...formData,
          price: parseFloat(formData.price),
          prep_time_minutes: formData.prep_time_minutes
            ? parseInt(formData.prep_time_minutes)
            : 0,
        };

        let savedItem;
        if (isEditing) {
          savedItem = await menuItemService.updateItem(id, dataToSubmit);
        } else {
          let orderedPhotos = [...pendingPhotos];
          if (primaryPendingPhotoId) {
            const primaryIndex = orderedPhotos.findIndex(
              (photo) => photo.id === primaryPendingPhotoId,
            );
            if (primaryIndex > 0) {
              const [primaryPhoto] = orderedPhotos.splice(primaryIndex, 1);
              orderedPhotos.unshift(primaryPhoto);
            }
          }

          savedItem = await menuItemService.createItem(
            dataToSubmit,
            orderedPhotos.map((photo) => photo.file),
          );
        }

        const itemId = savedItem.data?.id || id;
        if (itemId) {
          await menuItemService.attachModifierGroups(
            itemId,
            selectedModifierGroups,
          );
        }

        setSuccess(
          isEditing ? "Cập nhật món thành công!" : "Tạo món thành công!",
        );
        setTimeout(() => {
          navigate("/admin/menu/items");
        }, 1500);
      } catch (err) {
        setError(err.message || "Không thể lưu món ăn");
      } finally {
        setLoading(false);
      }
    },
    [
      formData,
      id,
      isEditing,
      navigate,
      pendingPhotos,
      primaryPendingPhotoId,
      selectedModifierGroups,
      validateForm,
    ],
  );

  const handlePhotoUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const validFiles = files.filter((file) => {
        const isValidType = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        );
        const isValidSize = file.size <= 5 * 1024 * 1024;
        return isValidType && isValidSize;
      });

      if (validFiles.length !== files.length) {
        setError("Đã bỏ qua một số file. Chỉ chấp nhận JPG/PNG/WebP dưới 5MB.");
      }

      if (validFiles.length === 0) return;

      if (!isEditing) {
        if (pendingPhotos.length + validFiles.length > 10) {
          setError("Tối đa 10 ảnh cho mỗi món.");
          return;
        }

        const newPendingPhotos = validFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));

        setPendingPhotos((prev) => {
          const updated = [...prev, ...newPendingPhotos];
          if (!primaryPendingPhotoId && updated.length > 0) {
            setPrimaryPendingPhotoId(updated[0].id);
          }
          return updated;
        });
        setSuccess("Đã thêm ảnh. Chúng sẽ được tải lên khi bạn tạo món.");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setUploadingPhotos(true);
      try {
        const response = await menuPhotoService.uploadPhotos(id, validFiles);
        setPhotos((prev) => [...prev, ...(response.photos || [])]);
        setSuccess("Tải ảnh thành công!");
      } catch (err) {
        setError(err.message || "Không thể tải ảnh");
      } finally {
        setUploadingPhotos(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [id, isEditing, pendingPhotos.length, primaryPendingPhotoId],
  );

  const handleRemovePendingPhoto = useCallback(
    (photoId) => {
      setPendingPhotos((prev) => {
        const photo = prev.find((item) => item.id === photoId);
        if (photo?.preview) {
          URL.revokeObjectURL(photo.preview);
        }
        const remaining = prev.filter((item) => item.id !== photoId);

        if (photoId === primaryPendingPhotoId) {
          setPrimaryPendingPhotoId(remaining.length > 0 ? remaining[0].id : null);
        }

        return remaining;
      });
    },
    [primaryPendingPhotoId],
  );

  const handleDeletePhoto = useCallback(
    async (photoId) => {
      if (!isEditing) return;

      try {
        await menuPhotoService.deletePhoto(id, photoId);
        setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
        setSuccess("Xóa ảnh thành công!");
      } catch (err) {
        setError(err.message || "Không thể xóa ảnh");
      }
    },
    [id, isEditing],
  );

  const handleSetPrimaryPhoto = useCallback(
    async (photoId) => {
      if (!isEditing) return;

      try {
        await menuPhotoService.setPrimaryPhoto(id, photoId);
        setPhotos((prev) =>
          prev.map((photo) => ({
            ...photo,
            is_primary: photo.id === photoId,
          })),
        );
        setSuccess("Đã cập nhật ảnh chính!");
      } catch (err) {
        setError(err.message || "Không thể đặt ảnh chính");
      }
    },
    [id, isEditing],
  );

  const toggleModifierGroup = useCallback((groupId) => {
    setSelectedModifierGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  }, []);

  return {
    categories,
    error,
    errors,
    fetchLoading,
    fileInputRef,
    formData,
    handleChange,
    handleDeletePhoto,
    handlePhotoUpload,
    handleRemovePendingPhoto,
    handleSetPrimaryPendingPhoto: setPrimaryPendingPhotoId,
    handleSetPrimaryPhoto,
    handleSubmit,
    isEditing,
    loading,
    modifierGroups,
    modifierModalOpen,
    navigate,
    pendingPhotos,
    photos,
    primaryPendingPhotoId,
    selectedModifierGroups,
    setError,
    setModifierModalOpen,
    setSuccess,
    success,
    toggleModifierGroup,
    uploadingPhotos,
  };
};

export default useMenuItemForm;
