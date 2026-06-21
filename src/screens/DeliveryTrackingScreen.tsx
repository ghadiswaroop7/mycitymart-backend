import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { HugeIcon } from '../components/HugeIcon';
import { CallIcon, Message01Icon, StarIcon, ShieldIcon, PackageIcon, Location01Icon, BikeIcon, Navigation02Icon, Tick02Icon } from '@hugeicons/core-free-icons';

const { width } = Dimensions.get('window');

export default function DeliveryTrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId = route.params?.orderId;
  const order = useSelector((state: RootState) => state.order.orders.find(o => o.id === orderId)) 
    || useSelector((state: RootState) => state.order.orders.find(o => !['delivered', 'cancelled'].includes(o.status?.toLowerCase())))
    || useSelector((state: RootState) => state.order.orders[0]);
  
  // Fake animation for the bike on the map
  const bikePos = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bikePos, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(bikePos, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [bikePos]);

  const bikeTranslateX = bikePos.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, width * 0.6]
  });

  const bikeTranslateY = bikePos.interpolate({
    inputRange: [0, 1],
    outputRange: [50, -100]
  });

  const status = order?.status?.toLowerCase() || 'placed';
  const isDelivered = status === 'delivered';
  const isCancelled = status === 'cancelled';
  const showBike = !isDelivered && !isCancelled;

  const getStatusText = () => {
    switch (status) {
      case 'placed': return 'ORDER PLACED';
      case 'confirmed': return 'ORDER CONFIRMED';
      case 'packed': return 'ORDER PACKED';
      case 'picked_up': return 'OUT FOR DELIVERY';
      case 'on_the_way': return 'ARRIVING SOON';
      case 'delivered': return 'DELIVERED';
      case 'cancelled': return 'CANCELLED';
      default: return 'PROCESSING';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'placed': return <HugeIcon icon={PackageIcon} size={20} color="#FFFFFF" />;
      case 'confirmed': return <HugeIcon icon={Tick02Icon} size={20} color="#FFFFFF" />;
      case 'packed': return <HugeIcon icon={PackageIcon} size={20} color="#FFFFFF" />;
      case 'delivered': return <HugeIcon icon={Tick02Icon} size={20} color="#FFFFFF" />;
      case 'cancelled': return <HugeIcon icon={CallIcon} size={20} color="#FFFFFF" />;
      default: return <HugeIcon icon={Navigation02Icon} size={20} color="#FFFFFF" />;
    }
  };

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      {/* ─── FAKE MAP VIEW (Full Screen Background) ─── */}
      <View className="absolute inset-0 bg-[#E5E5E5]">
        {/* Decorative Map Roads */}
        <View className="absolute top-40 left-0 right-0 h-4 bg-white/70 -rotate-12" />
        <View className="absolute top-80 left-20 bottom-0 w-4 bg-white/70 rotate-6" />
        <View className="absolute top-20 right-20 w-4 h-96 bg-white/70 -rotate-45" />
        
        {/* Animated Bike on Map */}
        {showBike && (
          <Animated.View 
            className="absolute top-1/2 left-1/4 z-10 items-center justify-center"
            style={{ transform: [{ translateX: bikeTranslateX }, { translateY: bikeTranslateY }] }}
          >
            <View className="w-10 h-10 bg-[#008B45] rounded-full items-center justify-center shadow-lg border-2 border-white">
              <HugeIcon icon={BikeIcon} size={20} color="#FFFFFF" />
            </View>
          </Animated.View>
        )}

        {/* Destination Pin */}
        <View className="absolute top-1/4 right-1/4 z-0 items-center justify-center">
          <View className={`w-12 h-12 rounded-full items-center justify-center shadow-lg ${isDelivered ? 'bg-[#008B45]' : 'bg-white'}`}>
            <HugeIcon icon={Location01Icon} size={24} color={isDelivered ? '#FFFFFF' : '#008B45'} fill={isDelivered ? '#FFFFFF' : '#008B45'} />
          </View>
          <View className="bg-black/80 px-3 py-1 rounded-full mt-2">
            <Text className="text-white text-[10px] font-bold">Home</Text>
          </View>
        </View>
      </View>

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* ─── HEADER ─── */}
        <View className="flex-row items-center justify-between px-4 pt-2">
          <TouchableOpacity 
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text className="text-[#1A1A1A] text-xl font-bold">←</Text>
          </TouchableOpacity>
          <View className="bg-white/90 px-4 py-2 rounded-full shadow-sm flex-row items-center">
            <HugeIcon icon={ShieldIcon} size={14} color="#4CAF50" className="mr-1.5" />
            <Text className="text-[#1A1A1A] font-bold text-xs tracking-wide">Secure Delivery</Text>
          </View>
          <View className="w-10 h-10" />
        </View>

        {/* Spacer to push card to bottom */}
        <View className="flex-1" />

        {/* ─── LIVE ETA FLOATING CHIP ─── */}
        <View className="items-center mb-4">
          <View className={`px-6 py-3 rounded-full shadow-lg flex-row items-center border-2 border-white ${isDelivered ? 'bg-[#2E7D32]' : isCancelled ? 'bg-red-500' : 'bg-[#008B45]'}`}>
            {getStatusIcon()}
            <Text className="text-white text-lg font-extrabold tracking-widest ml-2">{getStatusText()}</Text>
          </View>
        </View>

        {/* ─── BOTTOM CARD ─── */}
        <View className="bg-white rounded-t-[32px] shadow-lg border-t border-gray-100 overflow-hidden px-5 pt-6 pb-8">
          
          {/* Drag Handle */}
          <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center absolute top-3" />

          {/* Delivery Partner Info */}
          {!isCancelled && (
            <View className="flex-row items-center mb-6 mt-2">
              <View className="w-14 h-14 bg-orange-100 rounded-full items-center justify-center border-2 border-orange-200 mr-4">
                <Text className="text-orange-600 text-2xl">👨🏽‍🚀</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-[#1A1A1A] text-lg font-extrabold mr-2">Raju Sharma</Text>
                  <View className="bg-green-100 flex-row items-center px-1.5 py-0.5 rounded">
                    <HugeIcon icon={StarIcon} size={10} color="#2E7D32" fill="#2E7D32" />
                    <Text className="text-[#2E7D32] text-[10px] font-bold ml-1">4.8</Text>
                  </View>
                </View>
                <Text className="text-[#757575] text-[12px] font-medium mt-1">Hero Splendor • MH31 XX 1234</Text>
              </View>
              
              {/* Action Buttons */}
              <View className="flex-row">
                <TouchableOpacity className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-2 active:bg-blue-100">
                  <HugeIcon icon={Message01Icon} size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity className="w-10 h-10 bg-green-50 rounded-full items-center justify-center active:bg-green-100">
                  <HugeIcon icon={CallIcon} size={20} color="#4CAF50" fill="#4CAF50" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Divider */}
          {!isCancelled && <View className="h-[1px] bg-gray-100 w-full mb-5" />}

          {/* Order Details Snippet */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-50 rounded-lg items-center justify-center mr-3">
                <HugeIcon icon={PackageIcon} size={20} color="#757575" />
              </View>
              <View>
                <Text className="text-[#1A1A1A] text-sm font-bold">Order #{order?.id?.substring(0, 8).toUpperCase() || 'JP-84920'}</Text>
                <Text className="text-[#757575] text-[11px] mt-0.5">{order?.items?.length || 0} items • ₹{order?.totalAmount || 0}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')} className="bg-gray-50 px-4 py-2 rounded-full active:bg-gray-100">
              <Text className="text-[#008B45] text-xs font-bold">Orders</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}
