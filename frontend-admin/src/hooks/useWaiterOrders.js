import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import waiterService from "../services/waiterService";
import { getAuthToken } from "../utils/auth";
import {
  rejectWaiterOrderItemOptimistically,
  updateWaiterOrderStatusOptimistically,
  upsertWaiterOrder,
} from "../utils/waiterOrders";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_URL = API_BASE;

const NOTIFICATION_SOUND =
  "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleJlvwY+nMx8LP5jW3LJ5dGm9iqQvHwk/l9XXtnl1Z7iNpTIgCD+Y1di5e3Zlt4+mNSIIP5rV2Lx8d2S1kafxIwg/m9TYvn15ZLOTqPYkCT+c1NjAfnplsZWp+SUJP57U2MJ/e2WvlqryJgk/n9TYw4B8ZayXq+0nCT+g1NjEgX1lq5ir6CgJP6HU2MWCfmWomKzjKQk/otTYxoN/ZaaZrd4qCT+j1NjHhIBmpaub2SsJP6TU2MiFgGajq53ULAk/pdTYyYaBZqKsnc8tCT+m1NjKh4Jmoa2eyi4JP6fU2MuIg2afsJ7FMAI/qNTYzImDZp6xnsEzAj+p1NjNioRmnrKevjQCP6rU2M6KhGadsZ67NgI/q9TYz4uFZpy0nrg3Aj+s1NjQi4Vmm7WesTkCP63U2NGMhmabtp6tOgI/rtTY0o2GZpq3nqk8Aj+v1NjTjYdmmbiepj0CP7DU2NSNh2aZuZ6iQAI/sdTY1Y6IZpi6np5BAj+y1NjWj4lml7yelkMCP7PU2NeQiWaXvJ6SRAJAstXX2JCKZpa9npBFAkCz1dfZkYtmr8GdjkYCQH/M0tqXk26jy5yISQJAbr/H3J+edoTD1INQAkBbutfbnqBs";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

const useWaiterOrders = ({ onError, onSuccess, onUnauthorized } = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.8;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    if (!getAuthToken()) {
      onUnauthorized?.();
      return;
    }

    try {
      setLoading(true);
      const response = await waiterService.getOrders();
      if (response.success) {
        setOrders(response.data || []);
      }
    } catch (error) {
      onError?.(getErrorMessage(error, "Không thể tải danh sách đơn hàng."));
    } finally {
      setLoading(false);
    }
  }, [onError, onUnauthorized]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("new_order_created", (updatedOrder) => {
      playNotificationSound();
      setOrders((previousOrders) =>
        upsertWaiterOrder(previousOrders, updatedOrder),
      );
    });

    socketRef.current.on("order_status_updated", (updatedOrder) => {
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ),
      );
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [playNotificationSound]);

  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      setOrders((previousOrders) =>
        updateWaiterOrderStatusOptimistically(previousOrders, orderId, status),
      );

      try {
        await waiterService.updateOrderStatus(orderId, status);
        return true;
      } catch (error) {
        onError?.(getErrorMessage(error, "Không thể cập nhật trạng thái đơn."));
        refresh();
        return false;
      }
    },
    [onError, refresh],
  );

  const rejectOrderItem = useCallback(
    async (orderId, itemId, reason) => {
      setOrders((previousOrders) =>
        rejectWaiterOrderItemOptimistically(
          previousOrders,
          orderId,
          itemId,
          reason,
        ),
      );

      try {
        await waiterService.rejectOrderItem(itemId, reason);
        return true;
      } catch (error) {
        onError?.(getErrorMessage(error, "Không thể hủy món."));
        refresh();
        return false;
      }
    },
    [onError, refresh],
  );

  const confirmBill = useCallback(
    async (orderId, billData) => {
      try {
        await waiterService.confirmBill(orderId, billData);
        onSuccess?.("Đã gửi hóa đơn cho khách.");
        return true;
      } catch (error) {
        onError?.(getErrorMessage(error, "Không thể gửi hóa đơn."));
        return false;
      }
    },
    [onError, onSuccess],
  );

  const confirmCashPayment = useCallback(
    async (orderId) => {
      try {
        await waiterService.confirmCashPayment(orderId);
        setTimeout(
          () =>
            setOrders((previousOrders) =>
              previousOrders.filter((order) => order.id !== orderId),
            ),
          1000,
        );
        return true;
      } catch (error) {
        onError?.(getErrorMessage(error, "Không thể xác nhận thanh toán."));
        return false;
      }
    },
    [onError],
  );

  return {
    confirmBill,
    confirmCashPayment,
    loading,
    orders,
    refresh,
    rejectOrderItem,
    updateOrderStatus,
  };
};

export default useWaiterOrders;
