import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, PackageIcon, ClockIcon, Tick01Icon, ReloadIcon } from '@hugeicons/core-free-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setOrders } from '../store/slices/orderSlice';
import { subscribeToUserOrders } from '../services/firestoreService';

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { activeOrders, pastOrders } = useSelector((state: RootState) => state.order);
  
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid || 'dummy-user-id';

  useEffect(() => {
    // Real-time listener for orders
    const unsubscribe = subscribeToUserOrders(uid, (orders) => {
      dispatch(setOrders(orders));
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [uid, dispatch]);

  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'placed':
      case 'pending':
      case 'confirmed':
      case 'packed':
        return { label: 'PROCESSING', color: 'bg-orange-100 text-orange-700' };
      case 'picked_up':
      case 'on_the_way':
      case 'shipped':
        return { label: 'SHIPPED', color: 'bg-blue-100 text-blue-700' };
      case 'delivered': return { label: 'DELIVERED', color: 'bg-green-100 text-green-700' };
      case 'cancelled': return { label: 'CANCELLED', color: 'bg-red-100 text-red-700' };
      default: return { label: (status || 'UNKNOWN').toUpperCase(), color: 'bg-zinc-100 text-zinc-700' };
    }
  };

  const renderOrderCard = ({ item }: { item: any }) => {
    const statusInfo = getStatusDisplay(item.status);
    const date = item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Just now';
    const firstItem = item.items[0];

    return (
      <View className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-4 mx-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-xs font-bold text-zinc-500 mb-0.5">Order #{item.id.substring(0, 8).toUpperCase()}</Text>
            <Text className="text-[10px] text-zinc-400 font-bold">{date}</Text>
          </View>
          <View className={`px-2 py-1 rounded ${statusInfo.color.split(' ')[0]}`}>
            <Text className={`text-[10px] font-black uppercase tracking-wider ${statusInfo.color.split(' ')[1]}`}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View className="h-[1px] bg-zinc-100 mb-3" />

        {/* First Item Preview */}
        <View className="flex-row items-center mb-3">
          <View className="w-14 h-14 bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100 mr-3">
            {firstItem?.imageUrl ? (
              <Image source={{ uri: firstItem.imageUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center"><HugeIcon icon={PackageIcon} size={20} color="#9CA3AF" /></View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#1C1C1C]" numberOfLines={1}>{firstItem?.name || 'Items'}</Text>
            <Text className="text-xs font-semibold text-zinc-500">
              {item.items.length === 1 ? '1 item' : `+${item.items.length - 1} more items`}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-black text-[#1C1C1C] text-base">₹{item.totalAmount}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row items-center justify-end mt-2">
          {activeTab === 'active' ? (
            <TouchableOpacity 
              onPress={() => navigation.navigate('DeliveryTracking', { orderId: item.id })}
              className="bg-red-50 border border-[#008B45] px-6 py-2 rounded-lg"
            >
              <Text className="text-[#008B45] font-bold text-xs">Track Order</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row">
              <TouchableOpacity className="border border-zinc-200 px-4 py-2 rounded-lg mr-2">
                <Text className="text-[#1C1C1C] font-bold text-xs">Write Review</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-[#1C1C1C] px-6 py-2 rounded-lg flex-row items-center">
                <HugeIcon icon={ReloadIcon} size={12} color="white" className="mr-1.5" />
                <Text className="text-white font-bold text-xs">Reorder</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center bg-white border-b border-zinc-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <HugeIcon icon={ArrowLeft01Icon} size={28} color="#1C1C1C" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-[#1C1C1C]">My Orders</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 py-3 bg-white mb-2 shadow-sm">
        <TouchableOpacity 
          onPress={() => setActiveTab('active')}
          className={`flex-1 py-2 items-center border-b-2 ${activeTab === 'active' ? 'border-[#008B45]' : 'border-transparent'}`}
        >
          <Text className={`font-black ${activeTab === 'active' ? 'text-[#008B45]' : 'text-zinc-400'}`}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('past')}
          className={`flex-1 py-2 items-center border-b-2 ${activeTab === 'past' ? 'border-[#008B45]' : 'border-transparent'}`}
        >
          <Text className={`font-black ${activeTab === 'past' ? 'text-[#008B45]' : 'text-zinc-400'}`}>Past</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#008B45" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'active' ? activeOrders : pastOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 30 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <View className="w-24 h-24 bg-zinc-100 rounded-full items-center justify-center mb-4">
                {activeTab === 'active' ? <HugeIcon icon={ClockIcon} size={40} color="#9CA3AF" /> : <HugeIcon icon={Tick01Icon} size={40} color="#9CA3AF" />}
              </View>
              <Text className="text-[#1C1C1C] font-black text-lg mb-1">
                {activeTab === 'active' ? 'No active orders' : 'No past orders'}
              </Text>
              <Text className="text-zinc-500 font-medium text-xs">When you place an order, it will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
