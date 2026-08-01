import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import CustomerService from "../services/customerService";
// Không cần import TableService nữa vì backend trả về đủ rồi

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();

  const getFromPath = () => {
    if (location.state?.from) return location.state.from;
    const searchParams = new URLSearchParams(location.search);
    const tableId = searchParams.get('table');
    const token = searchParams.get('token');
    
    if (tableId || token) {
      const params = new URLSearchParams();
      if (tableId) params.append('table', tableId);
      if (token) params.append('token', token);
      return `/menu?${params.toString()}`;
    }
    return "/";
  };

  const fromPath = getFromPath();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      if (!CustomerService.isLoggedIn()) {
        navigate("/customer/login", { state: { from: location.pathname + location.search } });
        return;
      }

      const ordersResponse = await CustomerService.getOrders();
      // Backend đã include table, lấy dùng luôn, không cần gọi API khác
      setOrders(ordersResponse.data || []);
      
    } catch (err) {
      setError(err.message);
      if (err.message.includes("401")) {
        CustomerService.logout();
        navigate("/customer/login");
      }
    } finally {
      setLoading(false);
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HELPER: BADGE TRẠNG THÁI ---
  const getStatusBadge = (status) => {
    const configs = {
        completed: { label: 'Hoàn thành', class: 'bg-green-100 text-green-800 border-green-200' },
        cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-800 border-red-200' },
        pending:   { label: 'Chờ xác nhận', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        confirmed: { label: 'Đã xác nhận', class: 'bg-blue-100 text-blue-800 border-blue-200' },
        preparing: { label: 'Đang nấu', class: 'bg-orange-100 text-orange-800 border-orange-200' },
        ready:     { label: 'Sẵn sàng', class: 'bg-purple-100 text-purple-800 border-purple-200' },
        served:    { label: 'Đang phục vụ', class: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        payment:   { label: 'Thanh toán', class: 'bg-pink-100 text-pink-800 border-pink-200' },
    };

    const config = configs[status] || { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.class}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency', currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch sử đơn hàng</h1>
            <p className="text-gray-500 mt-1">Xem lại những món ăn bạn đã gọi</p>
          </div>
          <Link to={fromPath} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
             ← Quay lại Menu
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Đang tải lịch sử đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-16 text-center">
            <h3 className="text-xl font-bold text-red-700 mb-2">Không thể tải đơn hàng</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Bạn chưa có đơn hàng nào</h3>
            <Link to={fromPath} className="inline-block px-8 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors">
              Khám phá menu ngay
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày đặt</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vị trí</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng cộng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-orange-50/40 transition-colors group">
                      
                      {/* Ngày đặt */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-medium">{formatDate(order.created_at || order.ordered_at)}</span>
                      </td>

                      {/* Vị trí Bàn (Đọc trực tiếp từ Order) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                          {order.table ? `Bàn ${order.table.table_number}` : "Mang về"}
                        </span>
                      </td>

                      {/* Tổng tiền */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-orange-600">{formatCurrency(order.total_amount)}</span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Nút thao tác */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => navigate(`/customer/orders/${order.id}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all font-semibold active:scale-95 shadow-sm"
                        >
                          <span>Xem chi tiết</span>
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
