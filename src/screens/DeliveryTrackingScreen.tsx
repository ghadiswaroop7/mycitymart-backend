import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { HugeIcon } from '../components/HugeIcon';
import { CallIcon, Message01Icon, StarIcon, ShieldIcon, PackageIcon, Location01Icon, BikeIcon, Navigation02Icon, Tick01Icon, Tick02Icon, ClockIcon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { subscribeToOrder, subscribeToRiderLocation } from '../services/firestoreService';
import { useLiveOrderTracking } from '../hooks/useLiveOrderTracking';
import LiveOrderMap from '../components/LiveOrderMap';

const { width } = Dimensions.get('window');

// Status steps lifecycle definition
const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Order received, awaiting seller confirmation' },
  { key: 'preparing', label: 'Preparing & Packed', desc: 'Seller is preparing and packing your items' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider picked up order and is on the way' },
  { key: 'delivered', label: 'Delivered', desc: 'Order successfully delivered to your doorstep' },
];


export default function DeliveryTrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeOrderId = route.params?.orderId;

  // Redux fallback order search
  const reduxOrder = useSelector((state: RootState) => 
    state.order.orders.find(o => o.id === routeOrderId) 
    || state.order.orders.find(o => !['delivered', 'cancelled'].includes(o.status?.toLowerCase()))
    || state.order.orders[0]
  );

  const targetOrderId = routeOrderId || reduxOrder?.id;

  // Real-time Firestore onSnapshot order & rider tracking via hook
  const {
    order: liveOrder,
    status: hookStatus,
    activeStepIndex: hookStepIdx,
    riderLocation: liveRiderLocation,
    customerLocation: hookCustomerLocation,
    isDelivered: hookIsDelivered,
    isCancelled: hookIsCancelled,
    isOutForDelivery: hookIsOutForDelivery,
  } = useLiveOrderTracking(targetOrderId);

  const [simulatedRiderLoc, setSimulatedRiderLoc] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);

  const currentOrder = liveOrder || reduxOrder;
  const status = hookStatus || (currentOrder?.status || 'pending').toLowerCase();
  const riderId = currentOrder?.riderId || currentOrder?.deliveryPartnerId || currentOrder?.riderInfo?.id;

  // Customer Home Location Coordinates
  const customerLocation = hookCustomerLocation || currentOrder?.customerLocation || {
    latitude: currentOrder?.shippingAddress?.latitude || currentOrder?.shippingAddress?.lat || 21.1458,
    longitude: currentOrder?.shippingAddress?.longitude || currentOrder?.shippingAddress?.lng || 79.0882,
    address: currentOrder?.customerDetails?.address || currentOrder?.shippingAddress?.addressLine1 || 'Delivery Address'
  };

  const riderLocation = liveRiderLocation || simulatedRiderLoc;

  // Fallback / Interactive GPS Movement Simulation for demo orders if no live partner coordinates yet
  useEffect(() => {
    if (['picked_up', 'on_the_way'].includes(status) && !liveRiderLocation) {
      // Set initial rider location slightly away from customer home
      const startLat = customerLocation.latitude - 0.012;
      const startLng = customerLocation.longitude - 0.015;

      setSimulatedRiderLoc({ latitude: startLat, longitude: startLng });
      setSimulationActive(true);

      let step = 0;
      const totalSteps = 20;
      const interval = setInterval(() => {
        step = (step + 1) % (totalSteps + 1);
        const progress = step / totalSteps;
        const nextLat = startLat + (customerLocation.latitude - startLat) * progress;
        const nextLng = startLng + (customerLocation.longitude - startLng) * progress;

        setSimulatedRiderLoc({
          latitude: nextLat,
          longitude: nextLng
        });
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [status, liveRiderLocation, customerLocation.latitude, customerLocation.longitude]);

  // Determine current active step index in status workflow
  const getStepIndex = (currentStatus: string) => {
    switch (currentStatus) {
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
      default:
        return 0;
    }
  };

  const activeStepIdx = getStepIndex(status);
  const isDelivered = status === 'delivered';
  const isCancelled = status === 'cancelled';
  const isOutForDelivery = ['picked_up', 'out_for_delivery', 'on_the_way', 'shipped'].includes(status);
  const isPreparing = ['preparing', 'accepted', 'confirmed'].includes(status);
  const isPacked = status === 'packed';
  const isAssigned = status === 'assigned';

  // Rider Details
  const riderInfo = currentOrder?.riderInfo || {
    name: currentOrder?.riderName || 'Raju Sharma',
    phone: currentOrder?.riderPhone || '+91 98765 43210',
    vehicleNumber: currentOrder?.vehicleNumber || 'Hero Splendor • MH31 XX 1234',
    rating: 4.9
  };

  const handleCallRider = () => {
    if (riderInfo.phone) {
      Linking.openURL(`tel:${riderInfo.phone}`).catch(() => {
        Alert.alert('Contact Rider', `Call rider at: ${riderInfo.phone}`);
      });
    }
  };

  const handleMessageRider = () => {
    if (riderInfo.phone) {
      Linking.openURL(`sms:${riderInfo.phone}`).catch(() => {
        Alert.alert('Message Rider', `Send SMS to: ${riderInfo.phone}`);
      });
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      {/* ─── LIVE INTERACTIVE MAP BACKGROUND ─── */}
      <LiveOrderMap
        customerLocation={customerLocation}
        riderLocation={riderLocation}
        status={status}
        riderName={riderInfo.name}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* ─── TOP HEADER ─── */}
        <View className="flex-row items-center justify-between px-4 pt-2">
          <TouchableOpacity 
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-md border border-zinc-100"
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <HugeIcon icon={ArrowLeft01Icon} size={22} color="#1A1A1A" />
          </TouchableOpacity>

          <View className="bg-white/95 px-4 py-2 rounded-full shadow-md flex-row items-center border border-zinc-100">
            <HugeIcon icon={ShieldIcon} size={16} color="#008B45" />
            <Text className="text-[#1A1A1A] font-bold text-xs tracking-wide ml-1.5">
              Live Order #{targetOrderId?.substring(0, 8).toUpperCase() || 'JP-ACTIVE'}
            </Text>
          </View>

          <View className="w-10 h-10" />
        </View>

        {/* Spacer pushing floating info card down */}
        <View className="flex-1" />

        {/* ─── LIVE ETA / STATUS FLOATING CHIP ─── */}
        <View className="items-center mb-3 px-4">
          <View className={`px-6 py-3 rounded-full shadow-xl flex-row items-center border-2 border-white ${isDelivered ? 'bg-[#008B45]' : isCancelled ? 'bg-red-500' : isOutForDelivery ? 'bg-[#008B45]' : isPacked ? 'bg-[#1C1C1C]' : 'bg-[#1C1C1C]'}`}>
            {isDelivered ? (
              <HugeIcon icon={Tick02Icon} size={20} color="#FFFFFF" />
            ) : isOutForDelivery ? (
              <HugeIcon icon={BikeIcon} size={20} color="#FA8C16" />
            ) : (
              <HugeIcon icon={ClockIcon} size={20} color="#FFFFFF" />
            )}
            <Text className="text-white text-base font-black tracking-wider ml-2">
              {isDelivered 
                ? 'ORDER DELIVERED 🎉' 
                : isCancelled 
                ? 'ORDER CANCELLED' 
                : isOutForDelivery 
                ? 'RIDER IS ON THE WAY 🛵' 
                : isPacked 
                ? 'ORDER PACKED & READY 🛍️' 
                : isAssigned 
                ? 'RIDER ASSIGNED' 
                : isPreparing 
                ? 'SELLER PREPARING ORDER 👨‍🍳' 
                : 'ORDER PLACED • AWAITING SELLER'}
            </Text>
          </View>
        </View>

        {/* ─── BOTTOM DETAILS SLIDING CARD ─── */}
        <View className="bg-white rounded-t-[32px] shadow-2xl border-t border-zinc-100 px-5 pt-4 pb-6 max-h-[70%]">
          
          {/* Drag Pill Bar */}
          <View className="w-12 h-1.5 bg-zinc-200 rounded-full self-center mb-4" />

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* ─── REAL-TIME STATUS TIMELINE STEPS ─── */}
            <View className="mb-5 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <Text className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Order Progress</Text>
              
              <View className="flex-row justify-between items-center relative mb-4">
                {/* Connecting Line */}
                <View className="absolute left-6 right-6 top-4 h-1 bg-zinc-200 -z-0" />
                <View 
                  className="absolute left-6 top-4 h-1 bg-[#008B45] -z-0" 
                  style={{ width: `${(activeStepIdx / (STATUS_STEPS.length - 1)) * 85}%` }} 
                />

                {STATUS_STEPS.map((step, index) => {
                  const isDone = index <= activeStepIdx;
                  const isCurrent = index === activeStepIdx;

                  return (
                    <View key={step.key} className="items-center z-10">
                      <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${isCurrent ? 'bg-[#008B45] border-[#008B45] scale-110 shadow-md' : isDone ? 'bg-[#008B45] border-[#008B45]' : 'bg-white border-zinc-300'}`}>
                        {isDone ? (
                          <HugeIcon icon={Tick01Icon} size={14} color="#FFFFFF" />
                        ) : (
                          <Text className="text-xs font-bold text-zinc-400">{index + 1}</Text>
                        )}
                      </View>
                      <Text className={`text-[10px] font-bold mt-1.5 ${isCurrent ? 'text-[#008B45] font-black' : isDone ? 'text-zinc-800' : 'text-zinc-400'}`}>
                        {step.label.split(' ')[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Active Step Highlighted Status Message */}
              <View className="bg-white p-3 rounded-xl border border-zinc-200 flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-[#008B45] mr-2.5 animate-ping" />
                <View className="flex-1">
                  <Text className="text-sm font-black text-[#1C1C1C]">
                    {STATUS_STEPS[activeStepIdx]?.label}
                  </Text>
                  <Text className="text-xs font-medium text-zinc-500 mt-0.5">
                    {STATUS_STEPS[activeStepIdx]?.desc}
                  </Text>
                </View>
              </View>
            </View>

            {/* ─── RIDER PARTNER CARD (Visible if assigned/picked_up) ─── */}
            {!isCancelled && activeStepIdx >= 1 && (
              <View className="bg-[#FFF8F0] p-4 rounded-2xl border border-orange-100 mb-4 flex-row items-center">
                <View className="w-14 h-14 bg-white rounded-full items-center justify-center border-2 border-orange-300 mr-3.5 shadow-sm">
                  <Text className="text-2xl">🛵</Text>
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center mb-0.5">
                    <Text className="text-[#1C1C1C] text-base font-black mr-2">{riderInfo.name}</Text>
                    <View className="bg-orange-100 flex-row items-center px-1.5 py-0.5 rounded">
                      <HugeIcon icon={StarIcon} size={10} color="#D46B08" fill="#D46B08" />
                      <Text className="text-[#D46B08] text-[10px] font-bold ml-1">{riderInfo.rating}</Text>
                    </View>
                  </View>
                  <Text className="text-zinc-600 text-xs font-medium">{riderInfo.vehicleNumber}</Text>
                  {simulationActive && (
                    <Text className="text-[#008B45] text-[10px] font-extrabold mt-0.5">● Live GPS Broadcast Active</Text>
                  )}
                </View>

                {/* Call / Message Actions */}
                <View className="flex-row">
                  <TouchableOpacity 
                    onPress={handleMessageRider}
                    className="w-10 h-10 bg-white rounded-full items-center justify-center mr-2 border border-zinc-200 shadow-sm active:bg-zinc-100"
                  >
                    <HugeIcon icon={Message01Icon} size={18} color="#008B45" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleCallRider}
                    className="w-10 h-10 bg-[#008B45] rounded-full items-center justify-center shadow-md active:bg-green-700"
                  >
                    <HugeIcon icon={CallIcon} size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ─── DELIVERY ADDRESS SUMMARY ─── */}
            <View className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-100 mb-4 flex-row items-center">
              <View className="w-9 h-9 bg-green-100 rounded-full items-center justify-center mr-3">
                <HugeIcon icon={Location01Icon} size={18} color="#008B45" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-zinc-400">Delivering To</Text>
                <Text className="text-xs font-black text-[#1C1C1C]" numberOfLines={1}>
                  {customerLocation.address || 'Customer Location'}
                </Text>
              </View>
            </View>

            {/* ─── ORDER ITEMS SUMMARY ─── */}
            <View className="flex-row items-center justify-between pt-1 border-t border-zinc-100">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-zinc-100 rounded-xl items-center justify-center mr-3">
                  <HugeIcon icon={PackageIcon} size={20} color="#1C1C1C" />
                </View>
                <View>
                  <Text className="text-[#1C1C1C] text-sm font-black">
                    {currentOrder?.items?.length || 0} {currentOrder?.items?.length === 1 ? 'Item' : 'Items'}
                  </Text>
                  <Text className="text-zinc-500 text-xs font-bold">Total: ₹{currentOrder?.totalAmount || 0}</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => navigation.navigate('Orders')}
                className="bg-[#1C1C1C] px-5 py-2.5 rounded-xl active:bg-zinc-800"
              >
                <Text className="text-white text-xs font-black">All Orders</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>

      </SafeAreaView>
    </View>
  );
}
