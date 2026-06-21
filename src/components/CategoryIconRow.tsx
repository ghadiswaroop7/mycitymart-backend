import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

const CATEGORIES = [
  { id: '1', name: 'For You', icon: '✨', bgColor: 'bg-red-100' },
  { id: '2', name: 'Fresh Meat', icon: '🥩', bgColor: 'bg-orange-100' },
  { id: '3', name: 'Home Care', icon: '🧹', bgColor: 'bg-blue-100' },
  { id: '4', name: 'Grocery', icon: '🛒', bgColor: 'bg-green-100' },
  { id: '5', name: 'Mobiles', icon: '📱', bgColor: 'bg-purple-100' },
  { id: '6', name: 'Beauty', icon: '💄', bgColor: 'bg-pink-100' },
  { id: '7', name: 'Fashion', icon: '👗', bgColor: 'bg-teal-100' },
];

export default function CategoryIconRow() {
  return (
    <View className="bg-white py-4 border-b border-gray-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            className="items-center"
            activeOpacity={0.8}
          >
            <View className={`w-[60px] h-[60px] rounded-full items-center justify-center mb-2 ${cat.bgColor}`}>
              <Text className="text-3xl">{cat.icon}</Text>
            </View>
            <Text 
              className="text-[11px] text-[#1A1A1A] font-semibold text-center"
              style={{ width: 64 }}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
