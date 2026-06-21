import { HugeIcon } from '../../components/HugeIcon';
import { Location01Icon } from '@hugeicons/core-free-icons';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import ShopCard, { ShopProps } from '../../components/ShopCard';

const FILTERS = ['All', 'Open Now', 'Grocery', 'Vegetables', 'Medical', 'Electronics', 'Clothing', 'Food'];

const SHOPS: ShopProps[] = [
  { id: '1', name: 'Sharma Kirana Store', category: 'Grocery', rating: 4.3, reviewsCount: 120, distance: '0.2 km', deliveryTime: '15 min', isOpen: true, imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=200&q=80' },
  { id: '2', name: 'Raju Sabziwala', category: 'Vegetables', rating: 4.6, reviewsCount: 85, distance: '0.1 km', deliveryTime: '10 min', isOpen: true, imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' },
  { id: '3', name: 'Gupta Medical', category: 'Pharmacy', rating: 4.1, reviewsCount: 45, distance: '0.5 km', deliveryTime: '20 min', isOpen: true, imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=200&q=80' },
  { id: '4', name: 'Mohan Electronics', category: 'Electronics', rating: 3.9, reviewsCount: 22, distance: '0.8 km', deliveryTime: '45 min', isOpen: true, imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=200&q=80' },
  { id: '5', name: 'Laxmi Bakery', category: 'Food', rating: 4.7, reviewsCount: 210, distance: '0.3 km', deliveryTime: '15 min', isOpen: true, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80' },
];

export default function LocalShopsTab() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <View className="bg-gray-50 flex-1">
      {/* Location Header */}
      <View className="bg-white p-4 mb-2 shadow-sm border-b border-gray-100">
        <Text className="text-[#1A1A1A] text-[16px] font-extrabold mb-1"><HugeIcon icon={Location01Icon} size={16} /> Shops near Swaroop Nagar</Text>
        <Text className="text-[#757575] text-[12px]">Showing 24 shops within 2 km</Text>
      </View>

      {/* Filters */}
      <View className="bg-white py-3 mb-3 shadow-sm border-b border-gray-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity 
                key={filter} 
                onPress={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full border ${isActive ? 'bg-red-50 border-[#008B45]' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-[12px] font-bold ${isActive ? 'text-[#008B45]' : 'text-[#757575]'}`}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Shops List */}
      <View className="px-4 pb-4">
        {SHOPS.map(shop => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </View>

      {/* Feriwale Section */}
      <View className="bg-white py-5 px-4 mb-20 shadow-sm border-t border-gray-100">
        <View className="flex-row items-center mb-4">
          <Text className="text-[#1A1A1A] text-[15px] font-extrabold">🛵 Feriwale Near You — </Text>
          <View className="bg-red-100 px-2 py-0.5 rounded flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1" />
            <Text className="text-[#008B45] text-[10px] font-extrabold tracking-widest">LIVE NOW</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {[
            { name: "Ramesh Sabziwala", type: "Vegetables", distance: "200m away", img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80' },
            { name: "Chacha Falwale", type: "Fresh Fruits", distance: "350m away", img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=200&q=80' },
            { name: "Bholenath Ice Cream", type: "Desserts", distance: "500m away", img: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=200&q=80' },
          ].map((vendor, i) => (
            <View key={i} className="w-[140px] border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <View className="h-[90px] bg-gray-100">
                <Image source={{ uri: vendor.img }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
              </View>
              <View className="p-2">
                <Text className="text-[#1A1A1A] text-[12px] font-bold mb-0.5" numberOfLines={1}>{vendor.name}</Text>
                <Text className="text-[#FF6B35] text-[10px] font-bold mb-1">{vendor.type}</Text>
                <Text className="text-[#757575] text-[10px] font-medium">{vendor.distance}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
