import React, { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import Button from "../../common/Button";
import Input from "../../common/Input";
import Alert from "../../common/Alert";
import menuService from "../../../services/menuService";

const ModifierGroupForm = ({ isOpen, onClose, onSuccess, group }) => {
	const [formData, setFormData] = useState({
		name: "",
		selection_type: "single",
		is_required: false,
		min_selections: 0,
		max_selections: 1,
		display_order: 0,
		status: "active",
	});

	const [options, setOptions] = useState([]);
	const [newOption, setNewOption] = useState({
		name: "",
		price_adjustment: 0,
	});

	const [errors, setErrors] = useState({});
	const [loading, setLoading] = useState(false);
	const [apiError, setApiError] = useState(null);

	const isEditing = !!group;
	const formatPrice = (price) =>
		new Intl.NumberFormat("vi-VN", {
			style: "currency",
			currency: "VND",
		}).format(parseFloat(price) || 0);

	useEffect(() => {
		if (group) {
			setFormData({
				name: group.name || "",
				selection_type: group.selection_type || "single",
				is_required: group.is_required || false,
				min_selections: group.min_selections || 0,
				max_selections: group.max_selections || 1,
				display_order: group.display_order || 0,
				status: group.status || "active",
			});
			setOptions(group.options || []);
		} else {
			setFormData({
				name: "",
				selection_type: "single",
				is_required: false,
				min_selections: 0,
				max_selections: 1,
				display_order: 0,
				status: "active",
			});
			setOptions([]);
		}
		setNewOption({ name: "", price_adjustment: 0 });
		setErrors({});
		setApiError(null);
	}, [group, isOpen]);

	const validateForm = () => {
		const newErrors = {};

		if (!formData.name.trim()) {
			newErrors.name = "Tên nhóm là bắt buộc";
		} else if (formData.name.trim().length > 80) {
			newErrors.name = "Tên nhóm không được vượt quá 80 ký tự";
		}

		if (
			formData.min_selections > formData.max_selections &&
			formData.max_selections > 0
		) {
			newErrors.min_selections =
				"Số lựa chọn tối thiểu không được lớn hơn số tối đa";
		}

		if (
			formData.selection_type === "single" &&
			formData.max_selections > 1
		) {
			newErrors.max_selections =
				"Kiểu chọn một không thể có số lựa chọn tối đa lớn hơn 1";
		}

		if (formData.is_required && formData.min_selections === 0) {
			newErrors.min_selections =
				"Nhóm bắt buộc phải có tối thiểu 1 lựa chọn";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		let newValue = type === "checkbox" ? checked : value;

		if (type === "number") {
			newValue = parseInt(value, 10) || 0;
		}

		setFormData((prev) => {
			const updated = { ...prev, [name]: newValue };

			// Auto-adjust for single select
			if (name === "selection_type" && value === "single") {
				updated.max_selections = 1;
			}

			// Auto-set min_selections for required
			if (
				name === "is_required" &&
				checked &&
				prev.min_selections === 0
			) {
				updated.min_selections = 1;
			}

			return updated;
		});

		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: null }));
		}
	};

	const handleOptionChange = (e) => {
		const { name, value } = e.target;
		setNewOption((prev) => ({
			...prev,
			[name]:
				name === "price_adjustment" ? parseFloat(value) || 0 : value,
		}));
	};

	const addOption = () => {
		if (!newOption.name.trim()) {
			setErrors((prev) => ({
				...prev,
				newOption: "Tên lựa chọn là bắt buộc",
			}));
			return;
		}

		setOptions((prev) => [
			...prev,
			{
				id: `temp-${Date.now()}`,
				name: newOption.name.trim(),
				price_adjustment: newOption.price_adjustment || 0,
				status: "active",
				isNew: true,
			},
		]);
		setNewOption({ name: "", price_adjustment: 0 });
		setErrors((prev) => ({ ...prev, newOption: null }));
	};

	const removeOption = (optionId) => {
		setOptions((prev) => prev.filter((opt) => opt.id !== optionId));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) return;

		setLoading(true);
		setApiError(null);

		try {
			let savedGroup;

			if (isEditing) {
				savedGroup = await menuService.updateModifierGroup(
					group.id,
					formData
				);
			} else {
				savedGroup = await menuService.createModifierGroup(formData);
			}

			const groupId = savedGroup.data?.id || group?.id;

			// Create new options
			const newOptions = options.filter((opt) => opt.isNew);
			for (const opt of newOptions) {
				await menuService.createModifierOption(groupId, {
					name: opt.name,
					price_adjustment: opt.price_adjustment,
					status: opt.status,
				});
			}

			onSuccess();
		} catch (err) {
			setApiError(err.message || "Không thể lưu nhóm tùy chọn");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={isEditing ? "Chỉnh sửa nhóm tùy chọn" : "Tạo nhóm tùy chọn"}
			size="lg"
		>
			<form onSubmit={handleSubmit}>
				{apiError && (
					<Alert
						type="error"
						message={apiError}
						onClose={() => setApiError(null)}
					/>
				)}

				<div className="space-y-4">
					{/* Group Name */}
					<Input
						label="Tên nhóm"
						name="name"
						value={formData.name}
						onChange={handleChange}
						placeholder="VD: Kích cỡ, Topping, Cách chế biến"
						error={errors.name}
						required
					/>

					{/* Selection Type & Required */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Kiểu lựa chọn{" "}
								<span className="text-red-500">*</span>
							</label>
							<select
								name="selection_type"
								value={formData.selection_type}
								onChange={handleChange}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="single">
									Chọn một (Radio)
								</option>
								<option value="multiple">
									Chọn nhiều (Checkbox)
								</option>
							</select>
							<p className="text-xs text-gray-500 mt-1">
								{formData.selection_type === "single"
									? "Khách chỉ được chọn một lựa chọn"
									: "Khách có thể chọn nhiều lựa chọn"}
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Bắt buộc?
							</label>
							<label className="flex items-center gap-2 mt-2 cursor-pointer">
								<input
									type="checkbox"
									name="is_required"
									checked={formData.is_required}
									onChange={handleChange}
									className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
								/>
								<span className="text-sm text-gray-700">
									Khách phải chọn ít nhất một lựa chọn
								</span>
							</label>
						</div>
					</div>

					{/* Min/Max Selections (only for multiple) */}
					{formData.selection_type === "multiple" && (
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Số chọn tối thiểu
								</label>
								<input
									type="number"
									name="min_selections"
									value={formData.min_selections}
									onChange={handleChange}
									min={0}
									className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										errors.min_selections
											? "border-red-500"
											: "border-gray-300"
									}`}
								/>
								{errors.min_selections && (
									<p className="text-red-500 text-sm mt-1">
										{errors.min_selections}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Số chọn tối đa
								</label>
								<input
									type="number"
									name="max_selections"
									value={formData.max_selections}
									onChange={handleChange}
									min={0}
									className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										errors.max_selections
											? "border-red-500"
											: "border-gray-300"
									}`}
								/>
								{errors.max_selections && (
									<p className="text-red-500 text-sm mt-1">
										{errors.max_selections}
									</p>
								)}
								<p className="text-xs text-gray-500 mt-1">
									0 = không giới hạn
								</p>
							</div>
						</div>
					)}

					{/* Display Order & Status */}
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Thứ tự hiển thị"
							name="display_order"
							type="number"
							value={formData.display_order}
							onChange={handleChange}
							min={0}
						/>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Trạng thái
							</label>
							<select
								name="status"
								value={formData.status}
								onChange={handleChange}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="active">Hoạt động</option>
								<option value="inactive">Ngừng hoạt động</option>
							</select>
						</div>
					</div>

					{/* Options Section */}
					<div className="border-t pt-4 mt-4">
						<h3 className="text-lg font-medium text-gray-900 mb-3">
							Lựa chọn
						</h3>

						{/* Existing Options */}
						{options.length > 0 && (
							<div className="space-y-2 mb-4">
								{options.map((option) => (
									<div
										key={option.id}
										className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
									>
										<div className="flex items-center gap-3">
											<span className="font-medium text-gray-900">
												{option.name}
											</span>
											<span className="text-sm text-gray-500">
												{option.price_adjustment > 0
													? `+${formatPrice(option.price_adjustment)}`
													: `+${formatPrice(0)}`}
											</span>
											{option.isNew && (
												<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
													Mới
												</span>
											)}
										</div>
										<button
											type="button"
											onClick={() =>
												removeOption(option.id)
											}
											className="text-red-500 hover:text-red-600"
										>
											<svg
												className="w-5 h-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
								))}
							</div>
						)}

						{/* Add New Option */}
						<div className="flex gap-2 items-end">
							<div className="flex-1">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Tên lựa chọn
								</label>
								<input
									type="text"
									name="name"
									value={newOption.name}
									onChange={handleOptionChange}
									placeholder="VD: Nhỏ, Lớn, Thêm phô mai"
									className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										errors.newOption
											? "border-red-500"
											: "border-gray-300"
									}`}
								/>
								{errors.newOption && (
									<p className="text-red-500 text-sm mt-1">
										{errors.newOption}
									</p>
								)}
							</div>
							<div className="w-32">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Giá cộng thêm
								</label>
								<input
									type="number"
									name="price_adjustment"
									value={newOption.price_adjustment}
									onChange={handleOptionChange}
									step="0.01"
									min="0"
									placeholder="0.00"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={addOption}
							>
								Thêm
							</Button>
						</div>
					</div>
				</div>

				{/* Form Actions */}
				<div className="flex justify-end gap-3 mt-6 pt-4 border-t">
					<Button
						type="button"
						variant="secondary"
						onClick={onClose}
						disabled={loading}
					>
						Hủy
					</Button>
					<Button type="submit" disabled={loading}>
						{loading ? (
							<span className="flex items-center gap-2">
								<svg
									className="animate-spin w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								Đang lưu...
							</span>
						) : isEditing ? (
							"Cập nhật nhóm"
						) : (
							"Tạo nhóm"
						)}
					</Button>
				</div>
			</form>
		</Modal>
	);
};

export default ModifierGroupForm;
