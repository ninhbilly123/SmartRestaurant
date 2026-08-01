import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { io } from "socket.io-client";

import Loading from "../components/common/Loading";
import Alert from "../components/common/Alert";
import Pagination from "../components/common/Pagination";
import tableService from "../services/tableService";
import CustomerService from "../services/customerService";
import MenuHeader from "../components/menu/MenuHeader";
import MenuFooter from "../components/menu/MenuFooter";
import CategoryTabs from "../components/menu/CategoryTabs";
import MenuItemCard from "../components/menu/MenuItemCard";
import CartSidebar from "../components/menu/CartSidebar";
import CartButton from "../components/menu/CartButton";
import ModifierModal from "../components/menu/ModifierModal";
import MenuFilterBar from "../components/menu/MenuFilterBar";
import useCart from "../components/menu/hooks/useCart";

import OrderDetailModal from "../components/menu/OrderDetailModal";
import MenuItemDetailModal from "../components/menu/MenuItemDetailModal";
import FloatingOrderButton from "../components/menu/FloatingOrderButton";
import BillModal from "../components/menu/BillModal";
import { saveTableSession } from "../utils/tableSession";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const MenuPage = () => {
  // --- 1. CONFIG & STATE ---
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy params từ URL
  const tableId = searchParams.get("table");
  const token = searchParams.get("token");

  const socketRef = useRef();

  // State hiển thị
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuError, setMenuError] = useState(null);

  // Data
  const [tableInfo, setTableInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all"); // Mặc định là "all"

  // Modal & Selection
  const [detailItem, setDetailItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // Cho Modifier Modal
  const [orderPlacing, setOrderPlacing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [chefRecommended, setChefRecommended] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [allItems, setAllItems] = useState([]); // Lưu trữ tất cả items từ API
  const hadFilterRef = useRef(false); // Track if filter was applied (using ref to avoid re-render loops)

  // Pagination states
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const ITEMS_PER_PAGE = 12;

  // Active Order (Để check xem bàn này đang ăn gì)
  const [activeOrder, setActiveOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);

  // Lấy Cart từ Hook (CHỈ GỌI 1 LẦN DUY NHẤT Ở ĐÂY)
  const {
    cart,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
  } = useCart(tableId);

  // --- 2. HELPER ---
  const showToast = (icon, title) => {
    Swal.fire({
      icon,
      title,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  // Handler: Yêu cầu thanh toán (Bước 1: Chỉ gọi bill)
  const handleRequestPayment = async (orderId) => {
    try {
      const response = await CustomerService.requestPayment(orderId);

      if (response.success) {
        showToast("success", "Đã gửi yêu cầu thanh toán!");
        setShowBillModal(false);

        // Cập nhật active order với status mới
        if (response.data) {
          setActiveOrder(response.data);
        }

        // Hiển thị thông báo đang xử lý
        Swal.fire({
          title: "Đã gửi yêu cầu",
          text: "Vui lòng đợi nhân viên xác nhận hóa đơn",
          icon: "info",
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Payment request error:", error);
      throw error; // Re-throw để BillModal xử lý
    }
  };

  // --- 3. EFFECTS (Xử lý logic khi vào trang) ---

  // A. Kết nối Socket & Lắng nghe cập nhật đơn hàng
  useEffect(() => {
    if (!tableId) return;

    socketRef.current = io(SOCKET_URL);

    // Khi Bếp/Waiter cập nhật đơn -> Client nhận tin ở đây
    socketRef.current.on(`order_update_table_${tableId}`, (updatedOrder) => {
      console.log("Socket Update:", updatedOrder);
      setActiveOrder(updatedOrder);

      // Nếu đơn hoàn thành (Completed) -> Mời đánh giá
      if (updatedOrder.status === "completed") {
        Swal.fire({
          title: "Cảm ơn quý khách!",
          text: "Bữa ăn đã hoàn tất. Bạn có muốn đánh giá món ăn không?",
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Đánh giá ngay",
          cancelButtonText: "Để sau",
          confirmButtonColor: "#ea580c",
          cancelButtonColor: "#9ca3af",
        }).then((result) => {
          if (result.isConfirmed) {
            // Navigate đến OrderDetailPage nơi có nút review cho từng món
            navigate(`/customer/orders/${updatedOrder.id}`);
          }
          setActiveOrder(null); // Reset trạng thái bàn trống
        });
      }
      // Nếu đơn thay đổi trạng thái (VD: Confirmed -> Preparing) -> Báo nhẹ
      else if (activeOrder && activeOrder.status !== updatedOrder.status) {
        const statusMap = {
          confirmed: "Đã xác nhận",
          preparing: "Đang nấu",
          ready: "Món đã xong",
          served: "Đã phục vụ",
          payment_request: "Đang chờ hóa đơn...", // Khách vừa bấm gọi
          payment_pending: "Vui lòng thanh toán", // Waiter đã lập bill xong
          completed: "Hoàn tất",
        };
        showToast(
          "info",
          `Đơn hàng: ${statusMap[updatedOrder.status] || updatedOrder.status}`,
        );
      }
    });

    // 2. [MỚI] Nghe sự kiện Waiter đã CHỐT BILL (confirmBill)
    // -> Tự động bật BillModal lên để khách thấy tiền & trả
    socketRef.current.on(`bill_confirmed_table_${tableId}`, (updatedOrder) => {
      console.log("Bill Confirmed:", updatedOrder);
      setActiveOrder(updatedOrder);
      setShowOrderDetail(false);
      setShowBillModal(true); // 🔥 BẬT MODAL THANH TOÁN

      if (navigator.vibrate) navigator.vibrate(200);
      showToast("info", "Nhân viên đã gửi hóa đơn. Vui lòng kiểm tra!");
    });

    // 3. [MỚI] Nghe sự kiện Thanh toán thành công (Ví dụ trả tiền mặt)
    socketRef.current.on(`payment_success_table_${tableId}`, ({ orderId }) => {
      setShowBillModal(false);
      // Hiện thông báo và cũng hỏi đánh giá cho đồng bộ
      Swal.fire({
        title: "Thanh toán thành công!",
        text: "Cảm ơn quý khách! Bạn có muốn đánh giá ngay không?",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Đánh giá ngay",
        cancelButtonText: "Không",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(`/customer/orders/${orderId}`);
        }
        setActiveOrder(null);
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [tableId, navigate, activeOrder]);

  // B. Xác thực Token & Lấy thông tin bàn
  useEffect(() => {
    const initPage = async () => {
      if (!tableId || !token) {
        setError("Mã QR không hợp lệ hoặc thiếu thông tin.");
        setLoading(false);
        return;
      }
      try {
        // 1. Verify Table Token (với pagination mặc định)
        const response = await tableService.verifyQRToken(tableId, token, {
          page: 1,
          limit: ITEMS_PER_PAGE,
        });
        if (response.success) {
          setTableInfo(response.data);

          // Lưu session bàn để dùng sau khi thanh toán redirect về
          saveTableSession(tableId, token);

          // 2. Check xem bàn này có đơn chưa (Active Order)
          try {
            console.log("🔍 Đang fetch active order cho bàn:", tableId);
            const activeOrderRes =
              await CustomerService.getActiveOrder(tableId);
            console.log("📦 Active order response:", activeOrderRes);

            if (activeOrderRes.success && activeOrderRes.data) {
              console.log("✅ Tìm thấy active order:", activeOrderRes.data);
              setActiveOrder(activeOrderRes.data);
            } else {
              console.log("⚠️ Không có active order hoặc data null");
            }
          } catch (e) {
            // Log lỗi thay vì nuốt im
            console.error("❌ Lỗi khi fetch active order:", e);
          }
        } else {
          setError(response.message || "Xác thực mã QR thất bại.");
        }
      } catch (err) {
        console.error(err);
        setError("Lỗi kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [tableId, token]);

  // C. Xử lý dữ liệu Menu (Chia Category)
  useEffect(() => {
    if (!tableInfo) return;

    setMenuLoading(true);
    try {
      const rawCategories = tableInfo.categories || [];
      const items = tableInfo.items || [];
      const paginationData = tableInfo.pagination || {};

      // Lưu tất cả items để filter
      setAllItems(items);

      // Cập nhật pagination từ response ban đầu
      if (paginationData.totalPages) {
        setPagination({
          currentPage: paginationData.currentPage || 1,
          totalPages: paginationData.totalPages || 1,
          totalItems: paginationData.totalItems || items.length,
          limit: paginationData.limit || ITEMS_PER_PAGE,
          hasNextPage: paginationData.hasNextPage || false,
          hasPrevPage: paginationData.hasPrevPage || false,
        });
      }

      // Gom nhóm món ăn theo Category ID
      const itemsByCategory = items.reduce((acc, item) => {
        const catId = item.category?.id;
        if (catId) {
          if (!acc[catId]) acc[catId] = [];
          acc[catId].push(item);
        }
        return acc;
      }, {});

      // Map lại cấu trúc Category
      const categoriesWithItems = rawCategories.map((cat) => ({
        ...cat,
        items: itemsByCategory[cat.id] || [],
      }));

      setCategories(categoriesWithItems);
      // Mặc định chọn tab "Tất cả"
      setActiveCategory("all");
    } catch {
      setMenuError("Không thể hiển thị thực đơn.");
    } finally {
      setMenuLoading(false);
    }
  }, [tableInfo]);

  // D. Fetch menu với filters khi filter thay đổi
  const fetchMenuWithFilters = useCallback(
    async (page = 1) => {
      if (!tableId || !token) return;

      setMenuLoading(true);
      try {
        const filters = {
          page,
          limit: ITEMS_PER_PAGE,
        };
        if (searchQuery) filters.q = searchQuery;
        if (chefRecommended) filters.chefRecommended = "true";
        if (sortBy) filters.sort = sortBy;

        const response = await tableService.getMenuWithFilters(
          tableId,
          token,
          filters,
        );

        if (response.success && response.data) {
          const rawCategories = response.data.categories || [];
          const items = response.data.items || [];
          const paginationData = response.data.pagination || {};

          setAllItems(items);

          // Cập nhật pagination
          setPagination({
            currentPage: paginationData.currentPage || page,
            totalPages: paginationData.totalPages || 1,
            totalItems: paginationData.totalItems || items.length,
            limit: paginationData.limit || ITEMS_PER_PAGE,
            hasNextPage: paginationData.hasNextPage || false,
            hasPrevPage: paginationData.hasPrevPage || false,
          });

          // Gom nhóm món ăn theo Category ID
          const itemsByCategory = items.reduce((acc, item) => {
            const catId = item.category?.id;
            if (catId) {
              if (!acc[catId]) acc[catId] = [];
              acc[catId].push(item);
            }
            return acc;
          }, {});

          // Map lại cấu trúc Category
          const categoriesWithItems = rawCategories.map((cat) => ({
            ...cat,
            items: itemsByCategory[cat.id] || [],
          }));

          setCategories(categoriesWithItems);
        }
      } catch (err) {
        console.error("Error fetching menu with filters:", err);
      } finally {
        setMenuLoading(false);
      }
    },
    [tableId, token, searchQuery, chefRecommended, sortBy, ITEMS_PER_PAGE],
  );

  // Hàm reload menu gốc (phải định nghĩa trước useEffect sử dụng nó)
  const reloadOriginalMenu = useCallback(
    async (page = 1) => {
      if (!tableId || !token) return;

      setMenuLoading(true);
      try {
        const response = await tableService.verifyQRToken(tableId, token, {
          page,
          limit: ITEMS_PER_PAGE,
        });
        if (response.success && response.data) {
          const rawCategories = response.data.categories || [];
          const items = response.data.items || [];
          const paginationData = response.data.pagination || {};

          setAllItems(items);

          // Cập nhật pagination
          setPagination({
            currentPage: paginationData.currentPage || page,
            totalPages: paginationData.totalPages || 1,
            totalItems: paginationData.totalItems || items.length,
            limit: paginationData.limit || ITEMS_PER_PAGE,
            hasNextPage: paginationData.hasNextPage || false,
            hasPrevPage: paginationData.hasPrevPage || false,
          });

          const itemsByCategory = items.reduce((acc, item) => {
            const catId = item.category?.id;
            if (catId) {
              if (!acc[catId]) acc[catId] = [];
              acc[catId].push(item);
            }
            return acc;
          }, {});

          const categoriesWithItems = rawCategories.map((cat) => ({
            ...cat,
            items: itemsByCategory[cat.id] || [],
          }));

          setCategories(categoriesWithItems);
        }
      } catch (err) {
        console.error("Error reloading menu:", err);
      } finally {
        setMenuLoading(false);
      }
    },
    [tableId, token, ITEMS_PER_PAGE],
  );

  // Handler chuyển trang
  const handlePageChange = useCallback(
    (newPage) => {
      const hasActiveFilter = searchQuery || chefRecommended || sortBy;
      if (hasActiveFilter) {
        fetchMenuWithFilters(newPage);
      } else {
        reloadOriginalMenu(newPage);
      }
      // Scroll lên đầu danh sách món
      window.scrollTo({ top: 300, behavior: "smooth" });
    },
    [
      searchQuery,
      chefRecommended,
      sortBy,
      fetchMenuWithFilters,
      reloadOriginalMenu,
    ],
  );

  // Effect để gọi API khi filters thay đổi
  useEffect(() => {
    // Chỉ fetch khi đã có tableInfo (đã verify xong)
    if (!tableInfo) return;

    const hasActiveFilter = searchQuery || chefRecommended || sortBy;

    if (hasActiveFilter) {
      // Có filter -> gọi API với filter
      hadFilterRef.current = true;
      fetchMenuWithFilters();
    } else if (hadFilterRef.current) {
      // Không còn filter nhưng trước đó đã filter -> reload menu gốc
      hadFilterRef.current = false;
      reloadOriginalMenu();
    }
  }, [
    searchQuery,
    chefRecommended,
    sortBy,
    tableInfo,
    fetchMenuWithFilters,
    reloadOriginalMenu,
  ]);

  // Handler reset filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setChefRecommended(false);
    setSortBy("");
    // reloadOriginalMenu sẽ được gọi tự động bởi useEffect khi hadFilterRef.current = true và filters = empty
  }, []);

  // --- 4. HANDLERS (Sự kiện người dùng) ---

  const handleCustomize = (item) => setSelectedItem(item);
  const handleViewDetail = (item) => setDetailItem(item);

  // Lấy các món liên quan (cùng category, khác món đang xem)
  const getRelatedItems = useCallback(
    (item) => {
      if (!item?.category?.id) return [];

      // Lấy tất cả món từ tất cả categories
      const allMenuItems = categories.flatMap((cat) => cat.items || []);

      // Filter món cùng category, loại bỏ món đang xem, giới hạn 6 món
      return allMenuItems
        .filter(
          (menuItem) =>
            menuItem.category?.id === item.category.id &&
            menuItem.id !== item.id,
        )
        .slice(0, 6);
    },
    [categories],
  );

  const handleAddFromDetail = (item) => {
    setDetailItem(null);
    handleCustomize(item);
  };

  const handleAddFromModal = (
    item,
    modifiers,
    quantity,
    modifiersTotalPrice,
    note,
  ) => {
    addToCart(item, modifiers, quantity, modifiersTotalPrice, note);
    setSelectedItem(null);
    showToast("success", `Đã thêm ${item.name} vào giỏ`);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Giỏ hàng trống!",
        confirmButtonColor: "#ea580c",
      });
      return;
    }

    const isLoggedIn = CustomerService.isLoggedIn();
    if (!isLoggedIn) {
      const result = await Swal.fire({
        title: "Bạn chưa đăng nhập?",
        text: "Đăng nhập để tích điểm và nhận ưu đãi!",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Tiếp tục đặt (Khách)",
        cancelButtonText: "Đăng nhập ngay",
        confirmButtonColor: "#9ca3af",
        cancelButtonColor: "#ea580c",
        reverseButtons: true,
      });

      if (result.isDismissed) {
        // Người dùng bấm "Đăng nhập ngay"
        navigate("/customer/login", {
          state: { from: location.pathname + location.search },
        });
        return;
      }
    }

    setOrderPlacing(true);
    try {
      // Chuẩn bị dữ liệu gửi lên Server
      const cartItems = cart.map((item) => ({
        id: item.id, // menuItemId
        price: item.basePrice,
        quantity: item.quantity,
        name: item.name,
        notes: item.note || "",
        modifiers: item.modifiers || [],
      }));

      let orderResponse;
      const targetTableId = tableInfo?.table?.id || tableId;

      // Logic: Nếu đang có Active Order -> Gọi API thêm món (Gộp đơn)
      if (activeOrder) {
        try {
          orderResponse = await CustomerService.addItemsToOrder(
            activeOrder.id,
            cartItems,
          );
        } catch (err) {
          // ✅ NẾU ORDER CŨ KHÔNG TỒN TẠI/ĐÃ ĐÓNG -> TẠO ĐƠN MỚI
          if (err.shouldCreateNewOrder) {
            console.log("⚠️ Order cũ không hợp lệ, tạo đơn mới...");
            setActiveOrder(null); // Clear order cũ
            orderResponse = await CustomerService.createOrderWithItems(
              targetTableId,
              cartItems,
            );
          } else {
            throw err; // Throw lại lỗi khác
          }
        }
      } else {
        // Nếu chưa có -> Gọi API tạo đơn mới
        orderResponse = await CustomerService.createOrderWithItems(
          targetTableId,
          cartItems,
        );
      }

      if (orderResponse.success) {
        if (orderResponse.data) setActiveOrder(orderResponse.data);

        await Swal.fire({
          icon: "success",
          title: "Đã gửi yêu cầu!",
          text: "Vui lòng đợi nhân viên xác nhận.",
          showConfirmButton: false,
          timer: 2000,
        });

        clearCart();
        setIsCartOpen(false);
      } else {
        throw new Error(orderResponse.message);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err.message || "Không thể gửi đơn hàng.",
      });
    } finally {
      setOrderPlacing(false);
    }
  };

  // --- 5. RENDER ---

  // Kiểm tra xem có đang filter/sort không
  const hasActiveFilter = searchQuery || chefRecommended || sortBy;

  // Tính toán danh sách món theo category đang chọn
  const getCurrentItems = () => {
    // Nếu đang filter/sort, dùng trực tiếp allItems từ API (đã được sort sẵn)
    if (hasActiveFilter) {
      if (activeCategory === "all") {
        return allItems; // Giữ nguyên thứ tự từ API
      } else {
        // Filter theo category nhưng giữ thứ tự sort từ API
        return allItems.filter((item) => item.category?.id === activeCategory);
      }
    }

    // Không có filter -> hiển thị theo category như cũ
    if (activeCategory === "all") {
      // Lấy tất cả món từ tất cả categories
      return categories.reduce((acc, category) => {
        if (category.items && category.items.length > 0) {
          return [...acc, ...category.items];
        }
        return acc;
      }, []);
    } else {
      // Lấy món từ category được chọn
      const activeCategoryData = categories.find(
        (cat) => cat.id === activeCategory,
      );
      return activeCategoryData?.items || [];
    }
  };

  const currentItems = getCurrentItems();

  // Lấy tên category để hiển thị
  const getCategoryTitle = () => {
    if (activeCategory === "all") {
      return "Tất cả món ăn";
    }
    const activeCategoryData = categories.find(
      (cat) => cat.id === activeCategory,
    );
    return activeCategoryData?.name || "Thực đơn";
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="p-4 container mx-auto">
        <Alert type="error" message={error} />
      </div>
    );

  // Lấy tất cả items từ tất cả categories
  const allMenuItems = categories.flatMap((cat) => cat.items || []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MenuHeader
        tableNumber={tableInfo?.table?.table_number}
        cartItemCount={getTotalItems()}
      />

      <main className="container mx-auto px-4 py-6">
        {menuError && <Alert type="warning" message={menuError} />}

        {/* Filter Bar */}
        <MenuFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          chefRecommended={chefRecommended}
          onChefRecommendedChange={setChefRecommended}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onResetFilters={handleResetFilters}
        />

        {/* Danh sách Categories */}
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          totalItems={allMenuItems.length}
        />

        {/* Danh sách Món ăn */}
        {menuLoading ? (
          <Loading />
        ) : (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {getCategoryTitle()}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({currentItems.length} món)
              </span>
            </h3>
            {currentItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onViewDetail={handleViewDetail}
                    onCustomize={handleCustomize}
                  />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-500 bg-white rounded-xl border border-dashed">
                {activeCategory === "all"
                  ? "Chưa có món ăn nào trong thực đơn."
                  : "Chưa có món ăn trong danh mục này."}
              </div>
            )}

            {/* Pagination - luôn hiển thị nếu có nhiều trang */}
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              limit={pagination.limit}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Sidebar Giỏ hàng */}
        <CartSidebar
          cart={cart}
          cartTotal={cartTotal}
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onPlaceOrder={handlePlaceOrder}
          orderPlacing={orderPlacing}
        />

        {/* Nút Giỏ hàng trôi nổi (Chỉ hiện khi chưa mở giỏ và không xem chi tiết đơn) */}
        {!isCartOpen && !showOrderDetail && getTotalItems() > 0 && (
          <CartButton
            totalItems={getTotalItems()}
            cartTotal={cartTotal}
            onClick={() => setIsCartOpen(true)}
            className={activeOrder ? "bottom-24" : "bottom-6"} // Nếu có ActiveBar thì đẩy nút lên
          />
        )}

        {/* Modals */}
        <ModifierModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleAddFromModal}
        />

        <MenuItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onAddToOrder={handleAddFromDetail}
          relatedItems={detailItem ? getRelatedItems(detailItem) : []}
          onViewRelatedItem={handleViewDetail}
        />
      </main>

      {/* --- ACTIVE ORDER BAR (Thanh trạng thái đơn hàng) --- */}
      {/* Thay thế Footer mặc định nếu bàn đang có đơn */}
      {activeOrder && !isCartOpen && (
        <FloatingOrderButton
          order={activeOrder}
          onClick={() => setShowOrderDetail(true)}
        />
      )}

      {/* Modal Chi tiết đơn hàng */}
      {showOrderDetail && activeOrder && (
        <OrderDetailModal
          order={activeOrder}
          onClose={() => setShowOrderDetail(false)}
          onRequestBill={() => {
            setShowOrderDetail(false);
            setShowBillModal(true);
          }}
        />
      )}

      {/* Modal Hóa đơn thanh toán */}
      <BillModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        order={activeOrder}
        onRequestPayment={handleRequestPayment}
      />

      {/* Chỉ hiện Footer mặc định khi CHƯA có đơn active */}
      {!activeOrder && <MenuFooter />}
    </div>
  );
};

export default MenuPage;
