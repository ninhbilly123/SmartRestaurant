import React from "react";
import Loading from "../components/common/Loading";
import Alert from "../components/common/Alert";
import Pagination from "../components/common/Pagination";
import MenuHeader from "../components/menu/MenuHeader";
import MenuFooter from "../components/menu/MenuFooter";
import CategoryTabs from "../components/menu/CategoryTabs";
import MenuItemCard from "../components/menu/MenuItemCard";
import CartSidebar from "../components/menu/CartSidebar";
import CartButton from "../components/menu/CartButton";
import ModifierModal from "../components/menu/ModifierModal";
import MenuFilterBar from "../components/menu/MenuFilterBar";
import OrderDetailModal from "../components/menu/OrderDetailModal";
import MenuItemDetailModal from "../components/menu/MenuItemDetailModal";
import FloatingOrderButton from "../components/menu/FloatingOrderButton";
import BillModal from "../components/menu/BillModal";
import useMenuPage from "../hooks/useMenuPage";

const MenuPage = () => {
  const {
    activeCategory,
    activeOrder,
    cart,
    cartTotal,
    categories,
    chefRecommended,
    clearCart,
    detailItem,
    error,
    getRelatedItems,
    getCategoryTitle,
    getTotalItems,
    handleAddFromDetail,
    handleAddFromModal,
    handleCustomize,
    handlePageChange,
    handlePlaceOrder,
    handleRequestPayment,
    handleResetFilters,
    handleViewDetail,
    isCartOpen,
    currentItems,
    loading,
    menuError,
    menuLoading,
    orderPlacing,
    pagination,
    removeFromCart,
    searchQuery,
    selectedItem,
    setActiveCategory,
    setChefRecommended,
    setDetailItem,
    setIsCartOpen,
    setSearchQuery,
    setSelectedItem,
    setShowBillModal,
    setShowOrderDetail,
    setSortBy,
    showBillModal,
    showOrderDetail,
    sortBy,
    tableInfo,
    updateQuantity,
  } = useMenuPage();
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

