import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import tableService from "../../services/tableService";
import Button from "../common/Button";
import Loading from "../common/Loading";
import Alert from "../common/Alert";
import QRCodeManagement from "./QRCodeManagement";

const QRCodePage = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const [table, setTable] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchTable();
	}, [id]);

	const fetchTable = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await tableService.getTableById(id);
			setTable(response.data);
		} catch (err) {
			setError(err.message || "Không thể tải thông tin bàn");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
				<Loading size="lg" text="Đang tải thông tin bàn..." />
			</div>
		);
	}

	if (error || !table) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
				<div className="container mx-auto px-4 py-8">
					<div className="max-w-2xl mx-auto">
						<div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
							<div className="text-center mb-6">
								<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full mb-4">
									<svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								</div>
								<h2 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải thông tin bàn</h2>
								<p className="text-gray-600">{error || "Không tìm thấy bàn"}</p>
							</div>
							<div className="flex justify-center">
								<Button onClick={() => navigate("/tables")}>
									<span className="flex items-center gap-2">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
										</svg>
										Quay lại danh sách bàn
									</span>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
			<div className="container mx-auto px-4 py-8 max-w-5xl">
				{/* Header Card */}
				<div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
					<div className="flex items-start justify-between">
						<div className="flex items-start gap-4">
							{/* Back Button */}
							<button
								onClick={() => navigate("/tables")}
								className="mt-1 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110"
							>
								<svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
							</button>

							{/* Title Section */}
							<div className="flex-1">
								<div className="flex items-center gap-3 mb-2">
									<div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
										<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
										</svg>
									</div>
									<div>
										<h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
											Quản lý mã QR
										</h1>
									</div>
								</div>
								<p className="text-gray-600 ml-14">
									Tạo và quản lý mã QR để khách gọi món
								</p>
							</div>
						</div>
					</div>

					{/* Table Info Banner */}
					<div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
						<div className="flex items-center justify-between flex-wrap gap-4">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
									<span className="text-white font-bold text-lg">
										{table.table_number.substring(0, 2)}
									</span>
								</div>
								<div>
									<p className="text-sm text-gray-600 font-medium">Số bàn</p>
									<p className="text-xl font-bold text-gray-900">{table.table_number}</p>
								</div>
							</div>

							<div className="flex items-center gap-6">
								{table.capacity && (
									<div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
										<svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
										<div>
											<p className="text-xs text-gray-600">Sức chứa</p>
											<p className="font-bold text-gray-900">{table.capacity} người</p>
										</div>
									</div>
								)}

								{table.location && (
									<div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
										<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										<div>
											<p className="text-xs text-gray-600">Vị trí</p>
											<p className="font-bold text-gray-900">{table.location}</p>
										</div>
									</div>
								)}

								<div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
									<div className={`w-3 h-3 rounded-full ${table.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
									<div>
										<p className="text-xs text-gray-600">Trạng thái</p>
										<p className={`font-bold ${table.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
											{table.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* QR Code Management Component */}
				<QRCodeManagement table={table} onUpdate={fetchTable} />
			</div>
		</div>
	);
};

export default QRCodePage;
