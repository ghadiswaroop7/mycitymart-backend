import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { HugeIcon } from './HugeIcon';
import { StarIcon, Location01Icon, ClockIcon } from '@hugeicons/core-free-icons';

export type ShopProps = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewsCount?: number;
  distance: string;
  deliveryTime: string;
  isOpen: boolean;
  imageUrl?: string;
};

export default function ShopCard({ shop }: { shop: ShopProps }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="bg-white mb-3 p-3 flex-row items-center rounded-xl shadow-sm border border-[#E0E0E0]"
    >
      {/* Left: Image */}
      <View className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden mr-4">
        {shop.imageUrl ? (
          <Image source={{ uri: shop.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : null}
      </View>

      {/* Right: Info */}
      <View className="flex-1">
        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-[#1A1A1A] font-bold text-[16px] flex-1 mr-2" numberOfLines={1}>
            {shop.name}
          </Text>
          <View className="bg-orange-50 px-2 py-0.5 rounded-md">
            <Text className="text-[#FF6B35] text-[10px] font-bold uppercase">{shop.category}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-1.5">
          <HugeIcon icon={StarIcon} size={12} color="#F59E0B" fill="#F59E0B" />
          <Text className="text-[#1A1A1A] text-[12px] font-bold ml-1">{shop.rating}</Text>
          {shop.reviewsCount && (
            <Text className="text-[#757575] text-[11px] ml-1">({shop.reviewsCount})</Text>
          )}
        </View>

        <View className="flex-row items-center mb-2">
          <View className="flex-row items-center mr-3">
            <HugeIcon icon={Location01Icon} size={10} color="#757575" />
            <Text className="text-[#757575] text-[11px] ml-1">{shop.distance} away</Text>
          </View>
          <View className="flex-row items-center">
            <HugeIcon icon={ClockIcon} size={10} color="#757575" />
            <Text className="text-[#757575] text-[11px] ml-1">{shop.deliveryTime}</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-1.5 ${shop.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            <Text className={`text-[11px] font-bold ${shop.isOpen ? 'text-green-600' : 'text-red-600'}`}>
              {shop.isOpen ? 'Open Now' : 'Closed'}
            </Text>
          </View>
          <TouchableOpacity className="bg-[#008B45] px-3 py-1.5 rounded-full">
            <Text className="text-white text-[10px] font-bold">Order Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
