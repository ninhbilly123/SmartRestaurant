import React, { useState, useEffect } from "react";
import menuService from "../../../services/menuService";
import Button from "../../common/Button";
import Badge from "../../common/Badge";
import Loading from "../../common/Loading";
import Alert from "../../common/Alert";
import ConfirmDialog from "../../common/ConfirmDialog";
import ModifierGroupForm from "./ModifierGroupForm";

const ModifierGroupList = () => {
	const [modifierGroups, setModifierGroups] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingGroup, setEditingGroup] = useState(null);
	const [expandedGroups, setExpandedGroups] = useState({});

	const [confirmDialog, setConfirmDialog] = useState({
		isOpen: false,
		type: null,
		id: null,
		name: "",
		groupId: null,
	});

	useEffect(() => {
		fetchModifierGroups();
	}, []);

	const fetchModifierGroups = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await menuService.getModifierGroups();
			setModifierGroups(response.data || []);
		} catch (err) {
			setError(err.message || "Không thể tải nhóm tùy chọn");
		} finally {
			setLoading(false);
		}
	};

	const handleAddGroup = () => {
		setEditingGroup(null);
		setIsFormOpen(true);
	};

	const handleEditGroup = (group) => {
		setEditingGroup(group);
		setIsFormOpen(true);
	};

	const handleDeleteGroup = (group) => {
		setConfirmDialog({
			isOpen: true,
			type: "group",
			id: group.id,
			name: group.name,
			groupId: null,
		});
	};

	const handleDeleteOption = (groupId, option) => {
		setConfirmDialog({
			isOpen: true,
			type: "option",
			id: option.id,
			name: option.name,
			groupId: groupId,
		});
	};

	const confirmDelete = async () => {
		try {
			if (confirmDialog.type === "group") {
				await menuService.deleteModifierGroup(confirmDialog.id);
				setSuccess("Đã xóa nhóm tùy chọn thành công");
			} else {
				await menuService.deleteModifierOption(confirmDialog.id);
				setSuccess("Đã xóa lựa chọn thành công");
			}
			fetchModifierGroups();
		} catch (err) {
			setError(err.message || "Không thể xóa");
		} finally {
			setConfirmDialog({
				isOpen: false,
				type: null,
				id: null,
				name: "",
				groupId: null,
			});
		}
	};

	const handleFormSuccess = () => {
		setIsFormOpen(false);
		setEditingGroup(null);
		fetchModifierGroups();
		setSuccess(
			editingGroup
				? "Đã cập nhật nhóm tùy chọn thành công"
				: "Đã tạo nhóm tùy chọn thành công"
		);
	};

	const toggleExpand = (groupId) => {
		setExpandedGroups((prev) => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	const getStatusBadge = (status) => {
		return status === "active" ? (
			<Badge variant="success">Hoạt động</Badge>
		) : (
			<Badge variant="secondary">Ngừng hoạt động</Badge>
		);
	};

	const formatPrice = (price) => {
		const value = parseFloat(price) || 0;
		return `+${new Intl.NumberFormat("vi-VN", {
			style: "currency",
			currency: "VND",
		}).format(value)}`;
	};

	if (loading) return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
			<Loading size="lg" text="Đang tải nhóm tùy chọn..." />
		</div>
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-blue-50">
			<div className="container mx-auto px-4 py-8">
				{/* Header */}
				<div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
					<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
						<div className="flex items-center gap-3">
							<div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md">
								<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
								</svg>
							</div>
							<div>
								<h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
									Tùy chọn món ăn
								</h1>
								<p className="text-gray-600 mt-1">
									Quản lý nhóm tùy chọn và lựa chọn cho thực đơn
								</p>
							</div>
						</div>
						<Button onClick={handleAddGroup} className="shadow-md hover:shadow-lg transition-all">
							<span className="flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
								Thêm nhóm tùy chọn
							</span>
						</Button>
					</div>
				</div>

				{/* Alerts */}
				{error && <Alert type="error" message={error} onClose={() => setError(null)} />}
				{success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
						<div className="flex items-center justify-between mb-2">
							<p className="text-indigo-100 text-sm font-medium">Tổng nhóm</p>
							<svg className="w-8 h-8 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
							</svg>
						</div>
						<p className="text-4xl font-bold">{modifierGroups.length}</p>
					</div>

					<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
						<div className="flex items-center justify-between mb-2">
							<p className="text-blue-100 text-sm font-medium">Chọn một</p>
							<svg className="w-8 h-8 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<p className="text-4xl font-bold">{modifierGroups.filter(g => g.selection_type === "single").length}</p>
					</div>

					<div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
						<div className="flex items-center justify-between mb-2">
							<p className="text-purple-100 text-sm font-medium">Chọn nhiều</p>
							<svg className="w-8 h-8 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
							</svg>
						</div>
						<p className="text-4xl font-bold">{modifierGroups.filter(g => g.selection_type === "multiple").length}</p>
					</div>
				</div>

				{/* Info Card */}
				<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 mb-6 shadow-sm">
					<div className="flex items-start gap-3">
						<div className="p-2 bg-blue-500 rounded-lg">
							<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div className="text-sm text-blue-900 flex-1">
							<p className="font-semibold text-base mb-1">Nhóm tùy chọn là gì?</p>
							<p className="text-blue-800">
								Nhóm tùy chọn cho phép khách tùy chỉnh món ăn, ví dụ chọn kích cỡ hoặc thêm topping.
							</p>
						</div>
					</div>
				</div>

				{/* Modifier Groups List */}
				{modifierGroups.length === 0 ? (
					<div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
						<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
							<svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có nhóm tùy chọn</h3>
						<p className="text-gray-600 mb-6">
							Tạo nhóm tùy chọn để khách có thêm lựa chọn khi gọi món.
						</p>
						<Button onClick={handleAddGroup}>
							<span className="flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
								Tạo nhóm tùy chọn đầu tiên
							</span>
						</Button>
					</div>
				) : (
					<div className="space-y-4">
						{modifierGroups.map((group) => (
							<div key={group.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all hover:shadow-xl">
								{/* Group Header */}
								<div
									className="flex items-center justify-between p-5 cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-transparent transition-all"
									onClick={() => toggleExpand(group.id)}
								>
									<div className="flex items-center gap-4 flex-1">
										<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
											<svg
												className={`w-5 h-5 text-gray-600 transform transition-transform ${
													expandedGroups[group.id] ? "rotate-90" : ""
												}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</button>
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
												{getStatusBadge(group.status)}
											</div>
											<div className="flex flex-wrap items-center gap-3 text-sm">
												<span className={`px-3 py-1 rounded-lg font-medium ${
													group.selection_type === "single"
														? "bg-blue-100 text-blue-700"
														: "bg-purple-100 text-purple-700"
												}`}>
													{group.selection_type === "single" ? "○ Chọn một" : "☑ Chọn nhiều"}
												</span>
												{group.is_required && (
													<span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-medium">
														★ Bắt buộc
													</span>
												)}
												{group.selection_type === "multiple" && (
													<span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium">
														Tối thiểu: {group.min_selections}, Tối đa: {group.max_selections || "∞"}
													</span>
												)}
												<span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-medium">
													{group.options?.length || 0} lựa chọn
												</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
										<button
											onClick={() => handleEditGroup(group)}
											className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
											title="Sửa"
										>
											<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>
										<button
											onClick={() => handleDeleteGroup(group)}
											className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
											title="Xóa"
										>
											<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>

								{/* Options (Expandable) */}
								{expandedGroups[group.id] && (
									<div className="border-t-2 border-gray-100 bg-gradient-to-b from-gray-50 to-white">
										{!group.options || group.options.length === 0 ? (
											<div className="p-8 text-center">
												<svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
												</svg>
												<p className="text-gray-500 text-sm">Chưa có lựa chọn. Sửa nhóm này để thêm lựa chọn.</p>
											</div>
										) : (
											<div className="p-4 space-y-2">
												{group.options.map((option) => (
													<div
														key={option.id}
														className="flex items-center justify-between px-4 py-3 bg-white rounded-lg hover:bg-indigo-50 transition-all shadow-sm"
													>
														<div className="flex items-center gap-3">
															<div className={`w-3 h-3 rounded-full ${
																option.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"
															}`} />
															<span className="font-medium text-gray-900">{option.name}</span>
															<span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-sm font-semibold">
																{formatPrice(option.price_adjustment)}
															</span>
														</div>
														<button
															onClick={() => handleDeleteOption(group.id, option)}
															className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
															title="Xóa lựa chọn"
														>
															<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
															</svg>
														</button>
													</div>
												))}
											</div>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Modifier Group Form Modal */}
				<ModifierGroupForm
					isOpen={isFormOpen}
					onClose={() => {
						setIsFormOpen(false);
						setEditingGroup(null);
					}}
					onSuccess={handleFormSuccess}
					group={editingGroup}
				/>

				{/* Confirm Dialog */}
				<ConfirmDialog
					isOpen={confirmDialog.isOpen}
					onClose={() =>
						setConfirmDialog({
							isOpen: false,
							type: null,
							id: null,
							name: "",
							groupId: null,
						})
					}
					onConfirm={confirmDelete}
					title={
						confirmDialog.type === "group"
							? "Xóa nhóm tùy chọn"
							: "Xóa lựa chọn"
					}
					message={
						confirmDialog.type === "group"
							? `Bạn có chắc muốn xóa "${confirmDialog.name}" và toàn bộ lựa chọn bên trong không? Thao tác này không thể hoàn tác.`
							: `Bạn có chắc muốn xóa lựa chọn "${confirmDialog.name}" không?`
					}
					confirmText="Xóa"
					confirmVariant="danger"
				/>
			</div>
		</div>
	);
};

export default ModifierGroupList;
