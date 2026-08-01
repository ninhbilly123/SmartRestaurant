import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import kitchenService from "../services/kitchenService";
import {
  KITCHEN_NOTIFICATION_SOUND,
  KITCHEN_SOCKET_URL,
} from "../constants/kitchenDisplay";
import { mergeKitchenOrder } from "../utils/kitchenOrders";

const initialStats = {
  pending: 0,
  preparing: 0,
  ready: 0,
  completedToday: 0,
};

const useKitchenOrders = (soundEnabled) => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrders, setUpdatingOrders] = useState(new Set());

  const audioRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(KITCHEN_NOTIFICATION_SOUND);
    audioRef.current.volume = 0.8;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await kitchenService.getKitchenOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error(err);
      setError("Mất kết nối với máy chủ");
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await kitchenService.getKitchenStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchOrders(), fetchStats()]);
  }, [fetchOrders, fetchStats]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    };

    loadInitialData();

    socketRef.current = io(KITCHEN_SOCKET_URL);
    socketRef.current.on("order_status_updated", (updatedOrder) => {
      if (updatedOrder.status === "confirmed") {
        playNotificationSound();
      }

      setOrders((prev) => mergeKitchenOrder(prev, updatedOrder));
      fetchStats();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [fetchStats, playNotificationSound, refresh]);

  const handleStartOrder = useCallback(
    async (orderId) => {
      setUpdatingOrders((prev) => new Set(prev).add(orderId));
      try {
        setOrders((prev) =>
          prev.map((order) => {
            if (order.id !== orderId) return order;

            const items = order.items.map((item) =>
              item.status === "confirmed"
                ? { ...item, status: "preparing" }
                : item,
            );

            return { ...order, status: "preparing", items };
          }),
        );

        await kitchenService.updateOrderStatus(orderId, "preparing");
        fetchStats();
      } catch (err) {
        console.error(err);
        fetchOrders();
      } finally {
        setUpdatingOrders((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    },
    [fetchOrders, fetchStats],
  );

  const handleReadyOrder = useCallback(async (orderId) => {
    setUpdatingOrders((prev) => new Set(prev).add(orderId));
    try {
      await kitchenService.updateOrderStatus(orderId, "ready");
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingOrders((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }, []);

  return {
    error,
    handleReadyOrder,
    handleStartOrder,
    loading,
    orders,
    refresh,
    stats,
    updatingOrders,
  };
};

export default useKitchenOrders;
