import React from "react";
import useTableList from "../../hooks/useTableList";
import Button from "../common/Button";
import Badge from "../common/Badge";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import ConfirmDialog from "../common/ConfirmDialog";

const TableList = () => {
	const {
		closeConfirmDialog,
		confirmDialog,
		confirmStatusChange,
		error,
		filters,
		handleDownloadAllQR,
		handleFilterChange,
		handleSort,
		handleStatusChange,
		loading,
		locationOptions,
		navigate,
		resetFilters,
		setError,
		setSuccess,
		sortBy,
		sortOrder,
		success,
		summaryTables,
		tables,
	} = useTableList();

	const renderSortIcon = (field) => {
		if (sortBy !== field) return <span className="text-gray-400 ml-1">⇅</span>;
		return sortOrder === "asc" ? 
			<span className="ml-1 text-blue-600">↑</span> : 
			<span className="ml-1 text-blue-600">↓</span>;
	};

	if (loading) return <Loading size="lg" text="Đang tải danh sách bàn..." />;

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
			<div className="container mx-auto px-4 py-8">
				{/* Header */}
				<div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
					<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
									<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
								</div>
								<h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
									Quản lý bàn
								</h1>
							</div>
							<p className="text-gray-600 ml-14">
								Quản lý bàn và sơ đồ chỗ ngồi trong nhà hàng
							</p>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => handleDownloadAllQR("zip")}
								disabled={summaryTables.filter((t) => t.qr_token).length === 0}
								className="shadow-sm hover:shadow-md transition-all"
							>
								<span className="flex items-center gap-2">
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
									</svg>
									Tải tất cả QR
								</span>
							</Button>
							<Button 
								onClick={() => navigate("/tables/new")}
								className="shadow-md hover:shadow-lg transition-all"
							>
								<span className="flex items-center gap-2">
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
									Thêm bàn mới
								</span>
							</Button>
						</div>
					</div>
				</div>

				{/* Alerts */}
				{error && (
					<Alert type="error" message={error} onClose={() => setError(null)} />
				)}
				{success && (
					<Alert type="success" message={success} onClose={() => setSuccess(null)} />
				)}

				{/* Filters */}
				<div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
					<div className="flex items-center gap-2 mb-4">
						<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
						</svg>
						<h2 className="text-lg font-semibold text-gray-800">Bộ lọc</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						{/* Search */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Tìm kiếm
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>
								<input
									type="text"
									name="search"
									value={filters.search}
									onChange={handleFilterChange}
									placeholder="Tìm bàn..."
									className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
								/>
							</div>
						</div>

						{/* Status Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Trạng thái
							</label>
							<select
								name="status"
								value={filters.status}
								onChange={handleFilterChange}
								className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
							>
								<option value="all">Tất cả trạng thái</option>
								<option value="active">Hoạt động</option>
								<option value="inactive">Ngừng hoạt động</option>
							</select>
						</div>

						{/* Location Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Vị trí
							</label>
							<select
								name="location"
								value={filters.location}
								onChange={handleFilterChange}
								className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
							>
								<option value="all">Tất cả vị trí</option>
								{locationOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						{/* Clear Filters */}
						<div className="flex items-end">
							<Button
								variant="outline"
								className="w-full"
								onClick={resetFilters}
							>
								<span className="flex items-center justify-center gap-2">
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
									Xóa bộ lọc
								</span>
							</Button>
						</div>
					</div>
				</div>

				{/* Table Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
						<div className="flex items-center justify-between mb-2">
							<p className="text-blue-100 text-sm font-medium">Tổng số bàn</p>
							<svg className="w-8 h-8 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
						</div>
						<p className="text-4xl font-bold">{summaryTables.length}</p>
					</div>

					<div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
						<div className="flex items-center justify-between mb-2">
							<p className="text-green-100 text-sm font-medium">Đang hoạt động</p>
							<svg className="w-8 h-8 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<p className="text-4xl font-bold">
							{summaryTables.filter((t) => t.status === "active").length}
						</p>
					</div>

					<div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
						<div className="flex items-center justify-between mb-2">
							<p className="text-red-100 text-sm font-medium">Ngừng hoạt động</p>
							<svg className="w-8 h-8 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<p className="text-4xl font-bold">
							{summaryTables.filter((t) => t.status === "inactive").length}
						</p>
					</div>

					<div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
						<div className="flex items-center justify-between mb-2">
							<p className="text-purple-100 text-sm font-medium">Tổng sức chứa</p>
							<svg className="w-8 h-8 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
						<p className="text-4xl font-bold">
							{summaryTables.reduce((sum, t) => sum + (t.capacity || 0), 0)}
						</p>
					</div>
				</div>

				{/* Tables List */}
				<div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
					{tables.length === 0 ? (
						<div className="text-center py-16 px-4">
							<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
								<svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Không tìm thấy bàn
							</h3>
							<p className="text-gray-600 mb-6">
								Hãy tạo bàn đầu tiên để bắt đầu
							</p>
							<Button onClick={() => navigate("/tables/new")}>
								<span className="flex items-center gap-2">
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
									Tạo bàn đầu tiên
								</span>
							</Button>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-200">
									<tr>
										<th
											className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
											onClick={() => handleSort("table_number")}
										>
											<div className="flex items-center">
												Số bàn
												{renderSortIcon("table_number")}
											</div>
										</th>
										<th
											className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
											onClick={() => handleSort("capacity")}
										>
											<div className="flex items-center">
												Sức chứa
												{renderSortIcon("capacity")}
											</div>
										</th>
										<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
											Vị trí
										</th>
										<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
											Trạng thái
										</th>
										<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
											Mã QR
										</th>
										<th
											className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
											onClick={() => handleSort("created_at")}
										>
											<div className="flex items-center">
												Ngày tạo
												{renderSortIcon("created_at")}
											</div>
										</th>
										<th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
											Thao tác
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-100">
									{tables.map((table) => (
										<tr
											key={table.id}
											className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all"
										>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center font-bold text-blue-700">
														{table.table_number.substring(0, 2)}
													</div>
													<div>
														<div className="font-semibold text-gray-900">
															{table.table_number}
														</div>
														{table.description && (
															<div className="text-sm text-gray-500">
																{table.description}
															</div>
														)}
													</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 w-fit">
													<svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
													</svg>
													<span className="font-semibold text-gray-700">
														{table.capacity}
													</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-gray-900 font-medium">
													{table.location || "-"}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<Badge
													variant={table.status === "active" ? "success" : "danger"}
												>
													{table.status === "active" ? "Hoạt động" : "Ngừng hoạt động"}
												</Badge>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<Badge
													variant={table.qr_token ? "info" : "default"}
												>
													{table.qr_token ? "Đã tạo" : "Chưa tạo"}
												</Badge>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
												{new Date(table.created_at).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<div className="flex justify-end gap-2">
													<Button
														size="sm"
														variant="outline"
														onClick={() => navigate(`/tables/${table.id}`)}
													>
														Sửa
													</Button>
													<Button
														size="sm"
														variant={table.status === "active" ? "warning" : "success"}
														onClick={() =>
															handleStatusChange(
																table.id,
																table.table_number,
																table.status
															)
														}
													>
														{table.status === "active" ? "Ngừng" : "Kích hoạt"}
													</Button>
													<Button
														size="sm"
														variant="secondary"
														onClick={() => navigate(`/tables/${table.id}/qr`)}
													>
														Mã QR
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Confirm Dialog */}
			<ConfirmDialog
				isOpen={confirmDialog.isOpen}
				onClose={closeConfirmDialog}
				onConfirm={confirmStatusChange}
				title={`${
					confirmDialog.newStatus === "active"
						? "Kích hoạt"
						: "Ngừng hoạt động"
				} bàn`}
				message={`Bạn có chắc muốn ${
					confirmDialog.newStatus === "active"
						? "kích hoạt"
						: "ngừng hoạt động"
				} bàn "${confirmDialog.tableName}" không?`}
				confirmText={
					confirmDialog.newStatus === "active"
						? "Kích hoạt"
						: "Ngừng hoạt động"
				}
				variant={
					confirmDialog.newStatus === "active" ? "info" : "warning"
				}
			/>
		</div>
	);
};

export default TableList;
