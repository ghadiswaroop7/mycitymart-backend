import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function PromoCarousel({ data }: { data?: any[] }) {
  return (
    <View className="px-4 mt-6 mb-4">
      <View className="w-full bg-primary rounded-3xl overflow-hidden relative shadow-card">
        {/* Decorative elements simulating a vibrant diagonal gradient */}
        <View className="absolute -top-10 -right-10 w-48 h-48 bg-warmGradient rounded-full opacity-60" />
        <View className="absolute -bottom-16 -left-12 w-40 h-40 bg-orange-400 rounded-full opacity-50" />
        
        <View className="p-6 pt-8 pb-8 z-10">
          <Text className="text-white text-3xl font-extrabold mb-2 leading-tight w-4/5">
            Your neighbourhood,{'\n'}delivered with love. 💕
          </Text>
          <TouchableOpacity className="bg-white self-start rounded-full px-5 py-2.5 mt-4">
            <Text className="text-primary font-bold">Order Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
