import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { subscribeToOrder, subscribeToRiderLocation } from '../services/firestoreService';
import { setCurrentOrder, Order } from '../store/slices/orderSlice';

export interface UseLiveOrderTrackingResult {
  order: any | null;
  loading: boolean;
  error: string | null;
  status: string;
  activeStepIndex: number;
  statusLabel: string;
  isDelivered: boolean;
  isCancelled: boolean;
  isOutForDelivery: boolean;
  riderLocation: { latitude: number; longitude: number } | undefined;
  customerLocation: { latitude: number; longitude: number; address?: string };
}

export const getOrderStatusStepIndex = (rawStatus: string): number => {
  const status = (rawStatus || 'pending').toLowerCase();
  switch (status) {
    case 'pending':
    case 'placed':
      return 0;
    case 'accepted':
    case 'confirmed':
    case 'preparing':
    case 'packed':
    case 'assigned':
      return 1;
    case 'picked_up':
    case 'out_for_delivery':
    case 'on_the_way':
    case 'shipped':
      return 2;
    case 'delivered':
      return 3;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
};

export const getOrderStatusLabel = (rawStatus: string): string => {
  const status = (rawStatus || 'pending').toLowerCase();
  switch (status) {
    case 'pending':
    case 'placed':
      return 'Order Placed • Awaiting Seller';
    case 'accepted':
    case 'confirmed':
    case 'preparing':
      return 'Seller Preparing Order 👨‍🍳';
    case 'packed':
      return 'Order Packed & Ready 🛍️';
    case 'assigned':
      return 'Delivery Partner Assigned 🛵';
    case 'picked_up':
    case 'out_for_delivery':
    case 'on_the_way':
    case 'shipped':
      return 'Rider Is On The Way 🛵';
    case 'delivered':
      return 'Order Delivered 🎉';
    case 'cancelled':
      return 'Order Cancelled';
    default:
      return 'Processing Order';
  }
};

/**
 * Live Order Tracking Hook
 * Real-time listener for customer post-checkout live order fulfillment via Firestore onSnapshot
 */
export function useLiveOrderTracking(orderId?: string | null): UseLiveOrderTrackingResult {
  const dispatch = useDispatch();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(orderId));
  const [error, setError] = useState<string | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);

  // 1. Subscribe to order status in real time
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribeOrder = subscribeToOrder(orderId, (updatedOrder) => {
      setLoading(false);
      if (updatedOrder) {
        setOrder(updatedOrder);
        try {
          dispatch(setCurrentOrder(updatedOrder as Order));
        } catch {
          // ignore any non-serializable payload issues in redux
        }
      } else {
        setError('Order not found');
      }
    });

    return () => {
      unsubscribeOrder();
    };
  }, [orderId, dispatch]);

  // 2. Subscribe to live rider location if assigned/picked_up
  const riderId = order?.riderId || order?.deliveryPartnerId || order?.riderInfo?.id;
  useEffect(() => {
    if (!riderId) {
      setRiderLocation(undefined);
      return;
    }

    const unsubscribeRider = subscribeToRiderLocation(riderId, (locationData) => {
      if (locationData && locationData.latitude && locationData.longitude) {
        setRiderLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
      }
    });

    return () => {
      unsubscribeRider();
    };
  }, [riderId]);

  const rawStatus = (order?.status || 'pending').toLowerCase();
  const activeStepIndex = getOrderStatusStepIndex(rawStatus);
  const statusLabel = getOrderStatusLabel(rawStatus);
  const isDelivered = rawStatus === 'delivered';
  const isCancelled = rawStatus === 'cancelled';
  const isOutForDelivery = ['picked_up', 'out_for_delivery', 'on_the_way', 'shipped'].includes(rawStatus);

  const customerLocation = {
    latitude: order?.customerLocation?.latitude || order?.shippingAddress?.latitude || order?.shippingAddress?.lat || 21.1458,
    longitude: order?.customerLocation?.longitude || order?.shippingAddress?.longitude || order?.shippingAddress?.lng || 79.0882,
    address: order?.customerLocation?.address || order?.customerDetails?.address || order?.shippingAddress?.addressLine1 || 'Delivery Address'
  };

  return {
    order,
    loading,
    error,
    status: rawStatus,
    activeStepIndex,
    statusLabel,
    isDelivered,
    isCancelled,
    isOutForDelivery,
    riderLocation,
    customerLocation,
  };
}

export default useLiveOrderTracking;
